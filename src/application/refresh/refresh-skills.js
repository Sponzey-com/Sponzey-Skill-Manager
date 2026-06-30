import { calculateSyncStatus, normalizePath } from "../../domain/index.js";

export async function refreshSkills({
  context,
  skillRepository,
  targetStore,
  hashPort = null,
}) {
  const steps = ["LoadingSources"];
  const sourceResult = await skillRepository.scanSourceSkills({
    repositoryPath: context.mainRepositoryPath,
  });

  if (!sourceResult.ok) {
    return refreshFailed({
      diagnostics: [sourceResult.error],
      steps: [...steps, "SourceScanFailed"],
    });
  }

  const sources = [...sourceResult.sources].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const sourceHashByPath = await loadSourceHashes({ sources, hashPort });
  const sourceByPath = new Map(
    sources.map((source) => [normalizePath(source.sourcePath), source]),
  );
  const mainRepositorySkills = sources.map((source) => {
    const skill = {
      id: source.id,
      name: source.name,
      sourcePath: normalizePath(source.sourcePath),
      status: "inactive",
      appliedTargets: [],
    };
    const sourceHash = sourceHashByPath.get(normalizePath(source.sourcePath));
    if (sourceHash) {
      skill.sourceHash = sourceHash;
    }
    if (source.riskLevel) {
      skill.riskLevel = source.riskLevel;
    }
    if (source.lastAnalyzedAt) {
      skill.lastAnalyzedAt = source.lastAnalyzedAt;
    }
    return skill;
  });
  const mainSkillById = new Map(
    mainRepositorySkills.map((skill) => [skill.id, skill]),
  );
  const backupsResult = await loadBackups({
    repositoryPath: context.mainRepositoryPath,
    skillRepository,
  });

  steps.push("LoadingTargets");
  const targets = [...context.globalTargets, ...context.projectTargets];
  const globalSkills = [];
  const projectSkills = [];
  const diagnostics = [...backupsResult.diagnostics];
  const events = [];
  let appliedSkillCount = 0;

  for (const target of targets) {
    const targetResult = await targetStore.scanAppliedSkills({
      targetPath: target.targetPath,
      knownSourcePaths: sources.map((source) => source.sourcePath),
    });

    if (!targetResult.ok) {
      return refreshFailed({
        diagnostics: [targetResult.error],
        steps: [...steps, "TargetScanFailed"],
      });
    }

    const targetDiagnostics = targetResult.diagnostics.map((diagnostic) => ({
      ...diagnostic,
      targetId: target.id,
      targetPath: normalizePath(target.targetPath),
    }));
    diagnostics.push(...targetDiagnostics);

    const skills = await Promise.all(
      targetResult.appliedSkills.map((appliedSkill) =>
        mapAppliedSkill({
          appliedSkill,
          target,
          sourceByPath,
          mainSkillById,
          sourceHashByPath,
          hashPort,
        }),
      ),
    );

    const group = {
      targetId: target.id,
      clientType: target.clientType,
      scope: target.scope,
      targetPath: normalizePath(target.targetPath),
      skills,
    };

    if (target.workspacePath !== undefined) {
      group.workspacePath = normalizePath(target.workspacePath);
    }

    if (target.targetPattern !== undefined) {
      group.targetPattern = target.targetPattern;
    }

    appliedSkillCount += group.skills.length;
    events.push({
      level: "FieldDebugLog",
      code: "target.scan.completed",
      targetId: target.id,
      scope: target.scope,
      appliedSkillCount: group.skills.length,
      diagnosticCount: targetDiagnostics.length,
    });

    if (target.scope === "project") {
      projectSkills.push(group);
    } else {
      globalSkills.push(group);
    }
  }

  steps.push("MatchingSources");
  steps.push("CalculatingReadModel");

  events.push({
    level: "ProductLog",
    code: "skills.refresh.completed",
    sourceCount: mainRepositorySkills.length,
    targetCount: targets.length,
    appliedSkillCount,
    diagnosticCount: diagnostics.length,
  });

  const readModel = {
    mainRepositorySkills,
    globalSkills,
    projectSkills,
    diagnostics,
  };

  if (backupsResult.available) {
    readModel.backups = backupsResult.backups;
  }

  return {
    ok: true,
    readModel,
    events,
    steps: [...steps, "Completed"],
  };
}

async function loadBackups({ repositoryPath, skillRepository }) {
  if (typeof skillRepository?.scanBackups !== "function") {
    return {
      available: false,
      backups: [],
      diagnostics: [],
    };
  }

  const result = await skillRepository.scanBackups({ repositoryPath });
  if (!result.ok) {
    return {
      available: true,
      backups: [],
      diagnostics: [result.error],
    };
  }

  return {
    available: true,
    backups: [...(result.backups ?? [])].sort((left, right) =>
      `${left.skillName ?? ""}:${left.snapshotId ?? ""}`.localeCompare(
        `${right.skillName ?? ""}:${right.snapshotId ?? ""}`,
      ),
    ),
    diagnostics: result.diagnostics ?? [],
  };
}

async function mapAppliedSkill({
  appliedSkill,
  target,
  sourceByPath,
  mainSkillById,
  sourceHashByPath,
  hashPort,
}) {
  const sourcePath = sourcePathForAppliedSkill(appliedSkill);
  const source = sourcePath ? sourceByPath.get(normalizePath(sourcePath)) : null;
  const sourceId = source?.id ?? null;
  const syncEnabled = typeof hashPort?.hashDirectory === "function";
  const normalizedSourcePath = sourcePath ? normalizePath(sourcePath) : null;
  const currentSourceHash = normalizedSourcePath
    ? sourceHashByPath.get(normalizedSourcePath) ?? null
    : null;
  const currentTargetHash = await hashAppliedTarget({ appliedSkill, hashPort });

  if (sourceId && managedKind(appliedSkill.kind)) {
    const mainSkill = mainSkillById.get(sourceId);
    if (mainSkill) {
      const appliedTarget = {
        targetId: target.id,
        kind: appliedSkill.kind,
      };
      if (syncEnabled) {
        appliedTarget.syncStatus = calculateSyncStatus({
          kind: appliedSkill.kind,
          sourceExists: Boolean(sourceId),
          targetExists: true,
          sourceHash: appliedSkill.metadata?.sourceHash,
          targetHash: appliedSkill.metadata?.targetHash,
          currentSourceHash,
          currentTargetHash,
        });
      }
      mainSkill.status = "applied";
      mainSkill.appliedTargets.push(appliedTarget);
    }
  }

  const mapped = {
    name: appliedSkill.name,
    kind: appliedSkill.kind,
    status: appliedStatus({ appliedSkill, sourceId }),
    targetPath: normalizePath(appliedSkill.targetPath),
    sourceId,
  };

  if (syncEnabled) {
    mapped.syncStatus = calculateSyncStatus({
      kind: appliedSkill.kind,
      sourceExists: Boolean(sourceId) || !managedKind(appliedSkill.kind),
      targetExists: true,
      sourceHash: appliedSkill.metadata?.sourceHash,
      targetHash: appliedSkill.metadata?.targetHash,
      currentSourceHash,
      currentTargetHash,
    });
    mapped.sourceHash = currentSourceHash;
    mapped.targetHash = currentTargetHash;
    mapped.lastCheckedAt = null;
  }

  return mapped;
}

async function loadSourceHashes({ sources, hashPort }) {
  const sourceHashByPath = new Map();

  if (typeof hashPort?.hashDirectory !== "function") {
    return sourceHashByPath;
  }

  for (const source of sources) {
    const hashResult = await hashPort.hashDirectory({
      directoryPath: source.sourcePath,
    });
    if (hashResult.ok) {
      sourceHashByPath.set(normalizePath(source.sourcePath), hashResult.hash);
    }
  }

  return sourceHashByPath;
}

async function hashAppliedTarget({ appliedSkill, hashPort }) {
  if (
    appliedSkill.kind !== "managed-copy" ||
    typeof hashPort?.hashDirectory !== "function"
  ) {
    return null;
  }

  const hashResult = await hashPort.hashDirectory({
    directoryPath: appliedSkill.targetPath,
  });

  return hashResult.ok ? hashResult.hash : null;
}

function sourcePathForAppliedSkill(appliedSkill) {
  if (appliedSkill.sourcePath) {
    return appliedSkill.sourcePath;
  }

  if (appliedSkill.metadata?.sourcePath) {
    return appliedSkill.metadata.sourcePath;
  }

  return null;
}

function appliedStatus({ appliedSkill, sourceId }) {
  if (appliedSkill.kind === "broken-symlink") {
    return "broken";
  }

  if (appliedSkill.kind === "invalid-managed-copy") {
    return "invalid";
  }

  if (managedKind(appliedSkill.kind) && sourceId) {
    return "managed";
  }

  return "external";
}

function managedKind(kind) {
  return kind === "managed-symlink" || kind === "managed-copy";
}

function refreshFailed({ diagnostics, steps }) {
  return {
    ok: false,
    readModel: null,
    diagnostics,
    events: [
      {
        level: "ProductLog",
        code: "skills.refresh.failed",
        diagnosticCount: diagnostics.length,
      },
    ],
    steps,
  };
}
