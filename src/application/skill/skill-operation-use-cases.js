export async function getSkillDetail({ input, skillRepository, targetStore }) {
  const source = input?.source;
  const appliedSkill = input?.appliedSkill;

  if (source) {
    const filesResult = await readSourceFiles({ source, skillRepository });
    if (!filesResult.ok) {
      return failure("skill.detail.failed", filesResult.error, [
        "LoadingSourceDetail",
        "ReadFailed",
      ]);
    }

    return {
      ok: true,
      detail: {
        type: "source",
        id: source.id,
        name: source.name,
        sourcePath: source.sourcePath,
        skillMdPath: `${source.sourcePath}/SKILL.md`,
        riskLevel: source.riskLevel ?? "unknown",
        diagnostics: source.diagnostics ?? [],
        appliedTargetCount: source.appliedTargetCount ?? 0,
        files: Object.keys(filesResult.files).sort(),
      },
      diagnostics: [],
      events: [],
      steps: ["LoadingSourceDetail", "Completed"],
    };
  }

  if (appliedSkill) {
    return {
      ok: true,
      detail: {
        type: "applied",
        name: appliedSkill.name,
        kind: appliedSkill.kind,
        status: appliedSkill.status,
        syncStatus: appliedSkill.syncStatus ?? "Unknown",
        targetPath: appliedSkill.targetPath,
        sourceId: appliedSkill.sourceId ?? null,
        diagnostics: appliedSkill.diagnostics ?? [],
      },
      diagnostics: [],
      events: [],
      steps: ["LoadingAppliedDetail", "Completed"],
    };
  }

  return failure(
    "skill.detail.failed",
    {
      code: "skill-detail-input-required",
      severity: "error",
      message: "Source or applied skill input is required.",
    },
    ["ValidatingInput", "ValidationFailed"],
  );
}

export async function openSkillPath({ input, repositoryOpener }) {
  const path = pathForOpenInput(input);
  if (!path) {
    return failure(
      "skill.open.failed",
      {
        code: "skill-open-path-required",
        severity: "error",
        message: "A source, applied skill, or explicit path is required.",
      },
      ["ValidatingInput", "ValidationFailed"],
    );
  }

  if (typeof repositoryOpener?.openPath !== "function") {
    return failure(
      "skill.open.failed",
      {
        code: "repository-opener-unavailable",
        severity: "error",
        message: "Repository opener is unavailable.",
      },
      ["ValidatingInput", "RepositoryOpenerUnavailable"],
    );
  }

  const openResult = await repositoryOpener.openPath({
    path,
    openMode: input?.openKind === "skillMd" ? "editor" : "external",
  });
  if (!openResult.ok) {
    return failure("skill.open.failed", openResult.error, [
      "ValidatingInput",
      "OpenFailed",
    ]);
  }

  return {
    ok: true,
    openedPath: path,
    diagnostics: [],
    events: [],
    steps: ["ValidatingInput", "OpeningTarget", "Completed"],
  };
}

export async function analyzeAllSkills({ context, analyzer, skillRepository }) {
  const sourceResult = await skillRepository.scanSourceSkills({
    repositoryPath: context.mainRepositoryPath,
  });

  if (!sourceResult.ok) {
    return failure("skill.analysis.failed", sourceResult.error, [
      "LoadingSources",
      "SourceScanFailed",
    ]);
  }

  const summaries = [];
  const diagnostics = [];

  for (const source of sourceResult.sources) {
    const analysis = await analyzer.analyzeSourceSkill({ source });
    summaries.push({
      sourceId: source.id,
      name: source.name,
      riskLevel: analysis.riskLevel,
      diagnosticCount: analysis.diagnostics?.length ?? 0,
    });
    diagnostics.push(
      ...(analysis.diagnostics ?? []).map((diagnostic) => ({
        ...diagnostic,
        sourceId: source.id,
      })),
    );
  }

  return {
    ok: true,
    summaries,
    diagnostics,
    events: [
      {
        level: "ProductLog",
        code: "skill.analysis.completed",
        skillCount: summaries.length,
        diagnosticCount: diagnostics.length,
      },
    ],
    steps: [
      "LoadingSources",
      "ReadingSkillFiles",
      "RunningRules",
      "AggregatingDiagnostics",
      "Completed",
    ],
  };
}

export async function updateAppliedCopyFromSource({ input, targetStore }) {
  const appliedSkill = input?.appliedSkill;
  const source = input?.source;

  if (!appliedSkill || !source) {
    return failure(
      "skill.apply.blocked",
      {
        code: "update-copy-input-required",
        severity: "error",
        message: "Applied skill and source input are required.",
      },
      ["ValidatingInput", "InvalidInput"],
    );
  }

  if (appliedSkill.kind !== "managed-copy") {
    return failure(
      "skill.apply.blocked",
      {
        code: "update-copy-requires-managed-copy",
        severity: "error",
        message: "Only managed copy targets can be updated from source.",
      },
      ["ValidatingInput", "InvalidInput"],
    );
  }

  if (
    ["Target Changed", "Both Changed"].includes(appliedSkill.syncStatus) &&
    input.confirmationProvided !== true
  ) {
    return failure(
      "skill.apply.blocked",
      {
        code: "local-modification-blocked",
        severity: "error",
        message: "Target local modifications require explicit confirmation.",
      },
      ["ValidatingInput", "CalculatingSync", "LocalModificationBlocked"],
    );
  }

  if (typeof targetStore?.replaceCopyFromSource !== "function") {
    return failure(
      "skill.apply.blocked",
      {
        code: "target-store-update-unavailable",
        severity: "error",
        message: "Target store cannot update managed copies.",
      },
      ["ValidatingInput", "TargetStoreUnavailable"],
    );
  }

  const writeResult = await targetStore.replaceCopyFromSource({
    sourcePath: source.sourcePath,
    targetPath: appliedSkill.targetPath,
    metadata: {
      sourceSkillId: source.id,
      sourcePath: source.sourcePath,
      applyMode: "copy",
    },
  });

  if (!writeResult.ok) {
    return failure("skill.apply.blocked", writeResult.error, [
      "ValidatingInput",
      "WritingTarget",
      "WriteFailed",
    ]);
  }

  return {
    ok: true,
    updated: {
      skillName: appliedSkill.name,
      targetPath: writeResult.targetPath,
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.apply.completed",
        skillName: appliedSkill.name,
        operation: "update-copy-from-source",
      },
    ],
    steps: [
      "ValidatingInput",
      "LoadingAppliedSkill",
      "CalculatingSync",
      "WritingTarget",
      "WritingMetadata",
      "VerifyingResult",
      "Completed",
    ],
  };
}

export async function convertAppliedSkillMode({ input, targetStore }) {
  const appliedSkill = input?.appliedSkill;
  const source = input?.source;
  const targetMode = input?.targetMode;

  if (!appliedSkill || !source || !["copy", "symlink"].includes(targetMode)) {
    return failure(
      "skill.apply.blocked",
      {
        code: "conversion-input-required",
        severity: "error",
        message: "Applied skill, source, and target mode are required.",
      },
      ["ValidatingInput", "InvalidInput"],
    );
  }

  if (
    appliedSkill.kind === "managed-copy" &&
    targetMode === "symlink" &&
    ["Target Changed", "Both Changed"].includes(appliedSkill.syncStatus) &&
    input.confirmationProvided !== true
  ) {
    return failure(
      "skill.apply.blocked",
      {
        code: "local-modification-blocked",
        severity: "error",
        message: "Target local modifications require explicit confirmation.",
      },
      ["ValidatingInput", "CalculatingSync", "LocalModificationBlocked"],
    );
  }

  const methodName =
    targetMode === "copy" ? "convertSymlinkToCopy" : "convertCopyToSymlink";

  if (typeof targetStore?.[methodName] !== "function") {
    return failure(
      "skill.apply.blocked",
      {
        code: "target-store-conversion-unavailable",
        severity: "error",
        message: "Target store cannot convert applied skill mode.",
      },
      ["ValidatingInput", "TargetStoreUnavailable"],
    );
  }

  const result = await targetStore[methodName]({
    sourcePath: source.sourcePath,
    targetPath: appliedSkill.targetPath,
    metadata: {
      sourceSkillId: source.id,
      sourcePath: source.sourcePath,
      applyMode: targetMode,
    },
  });

  if (!result.ok) {
    return failure("skill.apply.blocked", result.error, [
      "ValidatingInput",
      "WritingTarget",
      "WriteFailed",
    ]);
  }

  return {
    ok: true,
    converted: {
      skillName: appliedSkill.name,
      targetPath: result.targetPath,
      applyMode: targetMode,
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.apply.completed",
        operation: "convert-applied-skill-mode",
        applyMode: targetMode,
      },
    ],
    steps: [
      "ValidatingInput",
      "LoadingAppliedSkill",
      "CalculatingSync",
      "PlanningConversion",
      "WritingTarget",
      "WritingMetadata",
      "VerifyingResult",
      "Completed",
    ],
  };
}

export async function renameSourceSkill({ context, input, skillRepository }) {
  return repositoryMutation({
    eventCode: "skill.source.rename.completed",
    unavailableCode: "source-rename-unavailable",
    methodName: "renameSourceSkill",
    skillRepository,
    input: {
      repositoryPath: context.mainRepositoryPath,
      oldName: input?.oldName ?? input?.source?.name,
      newName: input?.newName,
    },
    steps: ["ValidatingInput", "RenamingSource"],
  });
}

export async function deleteSourceSkill({ context, input, skillRepository }) {
  if (
    sourceAppliedTargetCount(input?.source) > 0 &&
    input?.impactConfirmed !== true
  ) {
    return failure(
      "skill.source.delete.blocked",
      {
        code: "source-delete-impact-confirmation-required",
        severity: "error",
        message: "Deleting an applied source requires explicit impact confirmation.",
      },
      ["ValidatingInput", "ImpactConfirmationRequired"],
    );
  }

  if (input?.confirmationProvided !== true) {
    return failure(
      "skill.source.delete.blocked",
      {
        code: "source-delete-confirmation-required",
        severity: "error",
        message: "Source delete requires explicit confirmation.",
      },
      ["ValidatingInput", "ConfirmationRequired"],
    );
  }

  return repositoryMutation({
    eventCode: "skill.source.delete.completed",
    unavailableCode: "source-delete-unavailable",
    methodName: "deleteSourceSkill",
    skillRepository,
    input: {
      repositoryPath: context.mainRepositoryPath,
      skillName: input?.skillName ?? input?.source?.name,
    },
    steps: ["ValidatingInput", "DeletingSource"],
  });
}

export async function exportSourceSkill({ context, input, skillRepository }) {
  return repositoryMutation({
    eventCode: "skill.source.export.completed",
    unavailableCode: "source-export-unavailable",
    methodName: "exportSourceSkill",
    skillRepository,
    input: {
      repositoryPath: context.mainRepositoryPath,
      skillName: input?.skillName ?? input?.source?.name,
      archivePath: input?.archivePath,
    },
    steps: ["ValidatingInput", "WritingArchive"],
  });
}

export async function importSkillArchiveToMainRepository({
  context,
  input,
  skillRepository,
}) {
  return repositoryMutation({
    eventCode: "skill.source.importArchive.completed",
    unavailableCode: "source-import-archive-unavailable",
    methodName: "importSkillArchiveToMainRepository",
    skillRepository,
    input: {
      repositoryPath: context.mainRepositoryPath,
      archivePath: input?.archivePath,
      skillName: input?.skillName,
    },
    steps: ["ValidatingInput", "ReadingArchive", "WritingSource"],
  });
}

export async function listSkillBackups({ context, skillRepository }) {
  if (typeof skillRepository?.scanBackups !== "function") {
    return failure(
      "skill.backup.list.failed",
      {
        code: "backup-scan-unavailable",
        severity: "error",
        message: "Backup scan is unavailable.",
      },
      ["ScanningBackups", "BackupStoreUnavailable"],
    );
  }

  const result = await skillRepository.scanBackups({
    repositoryPath: context.mainRepositoryPath,
  });
  if (!result.ok) {
    return failure("skill.backup.list.failed", result.error, [
      "ScanningBackups",
      "ScanFailed",
    ]);
  }

  return {
    ok: true,
    backups: result.backups,
    diagnostics: result.diagnostics ?? [],
    events: [],
    steps: ["ScanningBackups", "ParsingMetadata", "MappingReadModel", "Completed"],
  };
}

export async function promoteBackupToSkillSource({ context, input, skillRepository }) {
  return repositoryMutation({
    eventCode: "skill.backup.promote.completed",
    unavailableCode: "backup-promote-unavailable",
    methodName: "promoteBackupToSource",
    skillRepository,
    input: {
      repositoryPath: context.mainRepositoryPath,
      backupPath: input?.backupPath ?? input?.backup?.backupPath,
      skillName: input?.skillName,
    },
    steps: [
      "ValidatingInput",
      "LoadingBackup",
      "CheckingNameConflict",
      "CopyingBackupToSource",
      "WritingSourceMetadata",
    ],
  });
}

export async function deleteBackup({ input, skillRepository }) {
  if (input?.confirmationProvided !== true) {
    return failure(
      "skill.backup.delete.blocked",
      {
        code: "backup-delete-confirmation-required",
        severity: "error",
        message: "Backup delete requires explicit confirmation.",
      },
      ["ValidatingInput", "ConfirmationRequired"],
    );
  }

  return repositoryMutation({
    eventCode: "skill.backup.delete.completed",
    unavailableCode: "backup-delete-unavailable",
    methodName: "deleteBackup",
    skillRepository,
    input: {
      backupPath: input?.backupPath ?? input?.backup?.backupPath,
    },
    steps: ["ValidatingInput", "DeletingBackup"],
  });
}

async function repositoryMutation({
  eventCode,
  unavailableCode,
  methodName,
  skillRepository,
  input,
  steps,
}) {
  if (typeof skillRepository?.[methodName] !== "function") {
    return failure(
      eventCode.replace(".completed", ".failed"),
      {
        code: unavailableCode,
        severity: "error",
        message: "Repository operation is unavailable.",
      },
      [...steps, "RepositoryOperationUnavailable"],
    );
  }

  const result = await skillRepository[methodName](input);
  if (!result.ok) {
    return failure(eventCode.replace(".completed", ".failed"), result.error, [
      ...steps,
      "OperationFailed",
    ]);
  }

  return {
    ok: true,
    result,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: eventCode,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

async function readSourceFiles({ source, skillRepository }) {
  if (typeof skillRepository?.readSourceSkillFiles !== "function") {
    return {
      ok: true,
      files: {},
    };
  }

  const result = await skillRepository.readSourceSkillFiles({
    sourcePath: source.sourcePath,
  });
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    files: result.files,
  };
}

function pathForOpenInput(input) {
  if (input?.path) {
    return input.path;
  }

  if (input?.openKind === "skillMd" && input?.source?.sourcePath) {
    return `${input.source.sourcePath}/SKILL.md`;
  }

  if (input?.source?.sourcePath) {
    return input.source.sourcePath;
  }

  if (input?.appliedSkill?.targetPath) {
    return input.appliedSkill.targetPath;
  }

  return null;
}

function sourceAppliedTargetCount(source) {
  if (typeof source?.appliedTargetCount === "number") {
    return source.appliedTargetCount;
  }

  if (Array.isArray(source?.appliedTargets)) {
    return source.appliedTargets.length;
  }

  return 0;
}

function failure(eventCode, diagnostic, steps) {
  return {
    ok: false,
    diagnostics: [diagnostic],
    events: [
      {
        level: "ProductLog",
        code: eventCode,
        reason: diagnostic?.code,
      },
    ],
    steps,
  };
}
