import { confirmationRequiredDiagnostic } from "../confirmation/confirmation-diagnostics.js";

export async function copyAppliedSkillToMainRepository({
  context,
  input,
  skillRepository,
}) {
  const steps = ["ValidatingInput", "LoadingTargetSkill", "CheckingNameConflict"];
  const skillName = input.sourceName ?? input.appliedSkill.name;

  const copyResult = await skillRepository.copyTargetSkillToMainRepository({
    repositoryPath: context.mainRepositoryPath,
    targetSkillPath: input.appliedSkill.targetPath,
    skillName,
    origin: {
      type: "target-copy",
      targetId: input.target.id,
      targetPath: input.appliedSkill.targetPath,
    },
  });

  if (!copyResult.ok) {
    return transferFailed({
      diagnostics: [copyResult.error],
      steps: [...steps, failureStepForRepositoryError(copyResult.error)],
    });
  }

  steps.push("WritingMainRepository");
  steps.push("WritingTransferMetadata");

  return {
    ok: true,
    source: copyResult.source,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.copy.completed",
        skillName: copyResult.source.name,
        targetId: input.target.id,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function backupAppliedSkillToMainRepository({
  context,
  input,
  skillRepository,
}) {
  const steps = ["ValidatingInput", "LoadingTargetSkill"];
  const backupResult = await skillRepository.backupTargetSkillToMainRepository({
    repositoryPath: context.mainRepositoryPath,
    targetSkillPath: input.appliedSkill.targetPath,
    skillName: input.appliedSkill.name,
    snapshotId: input.snapshotId,
    metadata: {
      type: "target-backup",
      targetId: input.target.id,
      targetPath: input.appliedSkill.targetPath,
      skillName: input.appliedSkill.name,
      snapshotId: input.snapshotId,
    },
  });

  if (!backupResult.ok) {
    return transferFailed({
      diagnostics: [backupResult.error],
      steps: [...steps, failureStepForRepositoryError(backupResult.error)],
    });
  }

  steps.push("WritingBackupSnapshot");
  steps.push("WritingTransferMetadata");

  return {
    ok: true,
    backup: backupResult.backup,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.backup.completed",
        skillName: backupResult.backup.skillName,
        targetId: input.target.id,
        snapshotId: backupResult.backup.snapshotId,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function moveAppliedSkillToMainRepository({
  context,
  input,
  skillRepository,
  targetStore,
}) {
  const steps = ["ValidatingInput", "CheckingCleanupConfirmation"];

  if (input.cleanupConfirmed !== true) {
    const decision = confirmationRequiredDiagnostic({
      code: "cleanup-confirmation-required",
      operation: "move-applied-skill-to-main-repository",
      confirmationKey: "cleanupConfirmed",
      message: "Move requires explicit target cleanup confirmation.",
    });

    return {
      ok: false,
      moved: null,
      diagnostics: [decision],
      events: [
        {
          level: "ProductLog",
          code: "skill.transfer.move.blocked",
          skillName: input.appliedSkill.name,
          targetId: input.target.id,
          reason: decision.code,
        },
      ],
      steps: [...steps, "CleanupConfirmationRequired"],
    };
  }

  steps.push("LoadingTargetSkill");
  steps.push("CheckingNameConflict");

  const skillName = input.sourceName ?? input.appliedSkill.name;
  const copyResult = await skillRepository.copyTargetSkillToMainRepository({
    repositoryPath: context.mainRepositoryPath,
    targetSkillPath: input.appliedSkill.targetPath,
    skillName,
    origin: {
      type: "target-move",
      targetId: input.target.id,
      targetPath: input.appliedSkill.targetPath,
    },
  });

  if (!copyResult.ok) {
    return transferFailed({
      diagnostics: [copyResult.error],
      steps: [...steps, failureStepForRepositoryError(copyResult.error)],
    });
  }

  steps.push("WritingMainRepository");
  steps.push("OptionalTargetCleanup");

  const removeResult = await targetStore.removeTargetEntry({
    targetPath: input.appliedSkill.targetPath,
  });

  if (!removeResult.ok) {
    return transferFailed({
      diagnostics: [removeResult.error],
      steps: [...steps, "CleanupFailed"],
    });
  }

  return {
    ok: true,
    moved: {
      source: copyResult.source,
      removed: {
        removedPath: removeResult.removedPath,
        removedKind: removeResult.removedKind,
      },
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.move.completed",
        skillName: copyResult.source.name,
        targetId: input.target.id,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

function transferFailed({ diagnostics, steps }) {
  return {
    ok: false,
    diagnostics,
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.failed",
        diagnosticCount: diagnostics.length,
      },
    ],
    steps,
  };
}

function failureStepForRepositoryError(error) {
  if (error?.code === "source-name-conflict") {
    return "NameConflictBlocked";
  }

  return "WriteFailed";
}
