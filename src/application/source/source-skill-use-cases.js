import { createSkillName } from "../../domain/index.js";

export async function createSkill({ context, input, skillRepository }) {
  const steps = ["ValidatingInput"];
  const nameResult = createSkillName(input.name);

  if (!nameResult.ok) {
    return sourceCreateFailed({
      diagnostics: nameResult.diagnostics,
      steps: [...steps, "InvalidInput"],
    });
  }

  if (!hasText(context?.mainRepositoryPath)) {
    return sourceCreateFailed({
      diagnostics: [invalidMainRepositoryPath()],
      steps: [...steps, "InvalidMainRepository"],
    });
  }

  steps.push("CheckingNameConflict");
  steps.push("WritingMainRepository");

  const createResult = await skillRepository.createSourceSkill({
    repositoryPath: context.mainRepositoryPath,
    skillName: nameResult.value.value,
    description: input.description,
    body: input.body ?? "",
  });

  if (!createResult.ok) {
    return sourceCreateFailed({
      diagnostics: [createResult.error],
      steps: [...steps, failureStepForRepositoryError(createResult.error)],
    });
  }

  return {
    ok: true,
    source: createResult.source,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.created",
        skillName: createResult.source.name,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function importSkillToMainRepository({
  context,
  input,
  skillRepository,
  analyzer,
}) {
  const steps = ["ValidatingInput"];
  const nameResult = createSkillName(input.name);

  if (!nameResult.ok) {
    return sourceImportFailed({
      diagnostics: nameResult.diagnostics,
      steps: [...steps, "InvalidInput"],
    });
  }

  if (!hasText(context?.mainRepositoryPath)) {
    return sourceImportFailed({
      diagnostics: [invalidMainRepositoryPath()],
      steps: [...steps, "InvalidMainRepository"],
    });
  }

  steps.push("LoadingSourceFolder");
  steps.push("CheckingNameConflict");

  const importResult = await skillRepository.importSourceSkill({
    repositoryPath: context.mainRepositoryPath,
    externalSourcePath: input.externalSourcePath,
    skillName: nameResult.value.value,
    origin: {
      type: "local-folder",
      path: input.externalSourcePath,
    },
  });

  if (!importResult.ok) {
    return sourceImportFailed({
      diagnostics: [importResult.error],
      steps: [...steps, failureStepForRepositoryError(importResult.error)],
    });
  }

  steps.push("WritingMainRepository");
  steps.push("WritingMetadata");

  let analysis = null;
  const events = [];
  if (input.runAnalysisAfterImport) {
    steps.push("OptionalAnalysis");
    analysis = await analyzer.analyzeImportedSkill({
      source: importResult.source,
    });
    events.push({
      level: "FieldDebugLog",
      code: "skill.import.analysis.completed",
      skillName: importResult.source.name,
      riskLevel: analysis.riskLevel,
      diagnosticCount: analysis.diagnostics.length,
    });
  }

  events.push({
    level: "ProductLog",
    code: "skill.imported",
    skillName: importResult.source.name,
    diagnosticCount: analysis?.diagnostics.length ?? 0,
  });

  return {
    ok: true,
    source: importResult.source,
    analysis,
    diagnostics: [],
    events,
    steps: [...steps, "Completed"],
  };
}

export async function installSkillToMainRepository({
  context,
  input,
  skillRepository,
  skillSourceResolver,
  analyzer,
}) {
  let steps = ["ValidatingInput"];
  const installAllDiscoveredSkills = input.installAllDiscoveredSkills === true;
  const nameResult = installAllDiscoveredSkills
    ? null
    : createSkillName(input.name);
  const sourceReference = String(input.sourceReference ?? "").trim();

  if (nameResult && !nameResult.ok) {
    return sourceInstallFailed({
      diagnostics: nameResult.diagnostics,
      steps: [...steps, "InvalidInput"],
    });
  }

  if (!hasText(context?.mainRepositoryPath)) {
    return sourceInstallFailed({
      diagnostics: [invalidMainRepositoryPath()],
      steps: [...steps, "InvalidMainRepository"],
    });
  }

  if (sourceReference.length === 0) {
    return sourceInstallFailed({
      diagnostics: [invalidSourceReference()],
      steps: [...steps, "InvalidInput"],
    });
  }

  if (installAllDiscoveredSkills) {
    return installDiscoveredSkillsToMainRepository({
      context,
      input,
      sourceReference,
      skillRepository,
      skillSourceResolver,
      analyzer,
      steps,
    });
  }

  steps.push("ResolvingInstallSource");
  const resolvedSource = await skillSourceResolver.resolveInstallSource({
    reference: sourceReference,
  });

  if (!resolvedSource.ok) {
    return sourceInstallFailed({
      diagnostics: [resolvedSource.error],
      steps: [...steps, "ResolveFailed"],
    });
  }

  steps.push("LoadingSourceFolder");
  steps.push("CheckingNameConflict");

  const importResult = await skillRepository.importSourceSkill({
    repositoryPath: context.mainRepositoryPath,
    externalSourcePath: resolvedSource.sourcePath,
    skillName: nameResult.value.value,
    origin: resolvedSource.origin,
  });

  if (!importResult.ok) {
    steps = await cleanupInstallSource({
      resolvedSource,
      steps: [...steps, failureStepForRepositoryError(importResult.error)],
    });
    return sourceInstallFailed({
      diagnostics: [importResult.error],
      steps,
    });
  }

  steps.push("WritingMainRepository");
  steps.push("WritingMetadata");
  steps = await cleanupInstallSource({ resolvedSource, steps });

  let analysis = null;
  const events = [];
  if (input.runAnalysisAfterInstall) {
    steps.push("OptionalAnalysis");
    analysis = await analyzer.analyzeImportedSkill({
      source: importResult.source,
    });
    events.push({
      level: "FieldDebugLog",
      code: "skill.install.analysis.completed",
      skillName: importResult.source.name,
      riskLevel: analysis.riskLevel,
      diagnosticCount: analysis.diagnostics.length,
    });
  }

  events.push({
    level: "ProductLog",
    code: "skill.installed",
    skillName: importResult.source.name,
    originType: resolvedSource.origin?.type ?? "unknown",
    diagnosticCount: analysis?.diagnostics.length ?? 0,
  });

  return {
    ok: true,
    source: importResult.source,
    analysis,
    diagnostics: [],
    events,
    steps: [...steps, "Completed"],
  };
}

async function installDiscoveredSkillsToMainRepository({
  context,
  input,
  sourceReference,
  skillRepository,
  skillSourceResolver,
  analyzer,
  steps,
}) {
  if (typeof skillSourceResolver?.resolveInstallSources !== "function") {
    return sourceInstallFailed({
      diagnostics: [recursiveInstallUnavailable()],
      steps: [...steps, "ResolverUnavailable"],
    });
  }

  steps.push("DiscoveringInstallSources");
  const resolvedSources = await skillSourceResolver.resolveInstallSources({
    reference: sourceReference,
  });
  if (!resolvedSources.ok) {
    return sourceInstallFailed({
      diagnostics: [resolvedSources.error],
      steps: [...steps, "DiscoveryFailed"],
    });
  }

  steps.push("InstallingDiscoveredSkills");
  const installedSources = [];
  const failedDiagnostics = [];
  let failedCount = 0;

  for (const discoveredSource of resolvedSources.sources ?? []) {
    const nameResult = createSkillName(discoveredSource.name);
    if (!nameResult.ok) {
      failedCount += 1;
      failedDiagnostics.push(
        ...nameResult.diagnostics.map((diagnostic) => ({
          ...diagnostic,
          skillName: discoveredSource.name,
        })),
      );
      continue;
    }

    const importResult = await skillRepository.importSourceSkill({
      repositoryPath: context.mainRepositoryPath,
      externalSourcePath: discoveredSource.sourcePath,
      skillName: nameResult.value.value,
      origin: discoveredSource.origin,
    });
    if (!importResult.ok) {
      failedCount += 1;
      failedDiagnostics.push({
        ...importResult.error,
        skillName: nameResult.value.value,
      });
      continue;
    }

    installedSources.push(importResult.source);
  }

  steps = await cleanupInstallSource({
    resolvedSource: resolvedSources,
    steps,
  });

  const analyses = [];
  const events = [];
  if (input.runAnalysisAfterInstall && installedSources.length > 0) {
    steps.push("OptionalAnalysis");
    for (const source of installedSources) {
      const analysis = await analyzer.analyzeImportedSkill({ source });
      analyses.push({
        skillName: source.name,
        analysis,
      });
      events.push({
        level: "FieldDebugLog",
        code: "skill.install.analysis.completed",
        skillName: source.name,
        riskLevel: analysis.riskLevel,
        diagnosticCount: analysis.diagnostics.length,
      });
    }
  }

  const installSummary = {
    discoveredCount: resolvedSources.sources?.length ?? 0,
    installedCount: installedSources.length,
    failedCount,
  };
  const completed = installedSources.length > 0;
  events.push({
    level: "ProductLog",
    code: completed
      ? failedDiagnostics.length > 0
        ? "skill.install.batch.partially-completed"
        : "skill.install.batch.completed"
      : "skill.install.batch.failed",
    ...installSummary,
  });

  return {
    ok: completed,
    source: installedSources[0] ?? null,
    sources: installedSources,
    analysis: analyses[0]?.analysis ?? null,
    analyses,
    installSummary,
    diagnostics: failedDiagnostics,
    events,
    steps: [
      ...steps,
      completed
        ? failedDiagnostics.length > 0
          ? "PartiallyCompleted"
          : "Completed"
        : "Failed",
    ],
  };
}

function sourceCreateFailed({ diagnostics, steps }) {
  return {
    ok: false,
    source: null,
    diagnostics,
    events: [
      {
        level: "ProductLog",
        code: "skill.create.failed",
        diagnosticCount: diagnostics.length,
      },
    ],
    steps,
  };
}

function sourceImportFailed({ diagnostics, steps }) {
  return {
    ok: false,
    source: null,
    analysis: null,
    diagnostics,
    events: [
      {
        level: "ProductLog",
        code: "skill.import.failed",
        diagnosticCount: diagnostics.length,
      },
    ],
    steps,
  };
}

function sourceInstallFailed({ diagnostics, steps }) {
  return {
    ok: false,
    source: null,
    analysis: null,
    diagnostics,
    events: [
      {
        level: "ProductLog",
        code: "skill.install.failed",
        diagnosticCount: diagnostics.length,
      },
    ],
    steps,
  };
}

async function cleanupInstallSource({ resolvedSource, steps }) {
  if (typeof resolvedSource.cleanup !== "function") {
    return steps;
  }

  await resolvedSource.cleanup();
  return [...steps, "CleanupInstallSource"];
}

function invalidSourceReference() {
  return {
    code: "invalid-install-source-reference",
    severity: "error",
    message: "Install source reference must be a GitHub URL or local path.",
  };
}

function recursiveInstallUnavailable() {
  return {
    code: "recursive-install-resolver-unavailable",
    severity: "error",
    message: "Recursive GitHub skill discovery is unavailable.",
  };
}

function invalidMainRepositoryPath() {
  return {
    code: "invalid-main-repository-path",
    severity: "error",
    message:
      "Set Main Repository before creating, importing, or installing skills. Do not use an agent target path such as ~/.agents/skills or ~/.claude/skills.",
  };
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function failureStepForRepositoryError(error) {
  if (error?.code === "source-name-conflict") {
    return "NameConflictBlocked";
  }

  return "WriteFailed";
}
