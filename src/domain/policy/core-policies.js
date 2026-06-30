import { normalizePath } from "../model/core.js";

export function evaluateRepositoryPathPolicy({
  mainRepositoryPath,
  targetPaths,
}) {
  const decisions = [];
  const mainPath = normalizePath(mainRepositoryPath);

  for (const targetPathInput of targetPaths) {
    const targetPath = normalizePath(targetPathInput);
    const relation = pathRelation(mainPath, targetPath);

    if (relation !== "separate") {
      decisions.push({
        allow: false,
        code: "main-repository-overlaps-target",
        severity: "error",
        relation,
        message: "Main repository path must be separate from skill target paths.",
      });
    }
  }

  return {
    allow: decisions.length === 0,
    decisions,
  };
}

export function decideRemovePolicy({ wouldDeleteSource, isExternal = false }) {
  if (wouldDeleteSource) {
    return {
      allow: false,
      code: "remove-cannot-delete-source",
      severity: "error",
      message: "Remove operation must not delete the source skill.",
    };
  }

  if (isExternal) {
    return {
      allow: false,
      code: "external-remove-blocked",
      severity: "error",
      message: "External target skill removal is blocked by default.",
    };
  }

  return {
    allow: true,
    code: "remove-target-only-allowed",
    severity: "info",
    message: "Remove operation may remove the target entry only.",
  };
}

export function decideTransferPolicy({ operationType, wouldMutateTarget }) {
  if (operationType === "backup-to-main" && wouldMutateTarget) {
    return {
      allow: false,
      code: "backup-cannot-mutate-target",
      severity: "error",
      message: "Backup operation must not mutate the target skill.",
    };
  }

  return {
    allow: true,
    code: "transfer-operation-allowed",
    severity: "info",
    message: "Transfer operation is allowed by domain policy.",
  };
}

export function decideRiskPolicy({
  riskLevel,
  confirmationProvided = false,
}) {
  if (riskLevel === "critical") {
    return {
      allow: false,
      requiresConfirmation: false,
      code: "critical-risk-blocked",
      severity: "critical",
      message: "Critical risk skills must be blocked before target write.",
    };
  }

  if (riskLevel === "high" && !confirmationProvided) {
    return {
      allow: false,
      requiresConfirmation: true,
      code: "high-risk-confirmation-required",
      severity: "high",
      message: "High risk skills require explicit confirmation.",
    };
  }

  return {
    allow: true,
    requiresConfirmation: false,
    code: "risk-accepted",
    severity: riskLevel ?? "low",
    message: "Risk level is allowed by domain policy.",
  };
}

export function decideApplyConflictPolicy({ existingTargetKind }) {
  if (existingTargetKind === "external") {
    return {
      allow: false,
      code: "external-target-overwrite-forbidden",
      severity: "error",
      message: "External target skill must not be overwritten by default.",
    };
  }

  return {
    allow: true,
    code: "apply-conflict-allowed",
    severity: "info",
    message: "Apply operation is allowed by conflict policy.",
  };
}

export function calculateSyncStatus({
  kind,
  sourceExists = true,
  targetExists = true,
  sourceHash,
  targetHash,
  currentSourceHash,
  currentTargetHash,
}) {
  if (kind === "broken-symlink") {
    return "Broken Symlink";
  }

  if (kind === "external" || kind === "external-symlink") {
    return "External";
  }

  if (!sourceExists) {
    return "Missing Source";
  }

  if (!targetExists) {
    return "Missing Target";
  }

  if (kind === "managed-symlink") {
    return "In Sync";
  }

  const sourceChanged =
    hasText(sourceHash) &&
    hasText(currentSourceHash) &&
    sourceHash !== currentSourceHash;
  const targetChanged =
    hasText(targetHash) &&
    hasText(currentTargetHash) &&
    targetHash !== currentTargetHash;

  if (sourceChanged && targetChanged) {
    return "Both Changed";
  }

  if (sourceChanged) {
    return "Source Changed";
  }

  if (targetChanged) {
    return "Target Changed";
  }

  return "In Sync";
}

function pathRelation(leftPath, rightPath) {
  if (leftPath === rightPath) {
    return "equal";
  }

  if (leftPath.startsWith(`${rightPath}/`)) {
    return "main-inside-target";
  }

  if (rightPath.startsWith(`${leftPath}/`)) {
    return "target-inside-main";
  }

  return "separate";
}

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}
