import { decideRemovePolicy, decideRiskPolicy } from "../../domain/index.js";

export async function applySkillToTarget({
  context,
  input,
  analyzer,
  targetStore,
}) {
  const steps = ["ValidatingInput", "AnalyzingRisk"];
  const applyMode = input.applyMode ?? context.defaultApplyMode;
  const analysis = await analyzer.analyzeSourceSkill({
    source: input.source,
  });

  steps.push("CheckingRiskPolicy");
  const riskDecision = decideRiskPolicy({
    riskLevel: analysis.riskLevel,
    confirmationProvided: input.confirmationProvided === true,
  });

  if (!riskDecision.allow) {
    return applyBlocked({
      source: input.source,
      target: input.target,
      decision: riskDecision,
      steps: [...steps, "RiskBlocked"],
    });
  }

  if (applyMode !== "copy" && applyMode !== "symlink") {
    return applyBlocked({
      source: input.source,
      target: input.target,
      decision: {
        code: "unsupported-apply-mode",
        severity: "error",
        message: "Only copy apply mode is supported by this use case.",
      },
      steps: [...steps, "UnsupportedApplyMode"],
    });
  }

  steps.push("WritingTarget");
  const writeResult = await writeTargetByMode({
    applyMode,
    source: input.source,
    target: input.target,
    targetStore,
  });

  if (!writeResult.ok) {
    return applyBlocked({
      source: input.source,
      target: input.target,
      decision: normalizeApplyWriteFailure(writeResult.error),
      steps: [...steps, "WriteFailed"],
    });
  }

  steps.push("VerifyingResult");

  return {
    ok: true,
    applied: {
      skillName: input.source.name,
      targetId: input.target.id,
      applyMode,
      targetPath: writeResult.targetPath,
    },
    diagnostics: [],
    events: [
      {
        level: "FieldDebugLog",
        code: "skill.apply.risk.accepted",
        skillName: input.source.name,
        riskLevel: analysis.riskLevel,
      },
      {
        level: "ProductLog",
        code: "skill.apply.completed",
        skillName: input.source.name,
        targetId: input.target.id,
        applyMode,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

async function writeTargetByMode({ applyMode, source, target, targetStore }) {
  if (applyMode === "symlink") {
    return targetStore.linkSkillToTarget({
      sourcePath: source.sourcePath,
      targetRootPath: target.targetPath,
      skillName: source.name,
    });
  }

  return targetStore.copySkillToTarget({
    sourcePath: source.sourcePath,
    targetRootPath: target.targetPath,
    skillName: source.name,
    metadata: {
      sourceSkillId: source.id,
      sourcePath: source.sourcePath,
      targetId: target.id,
      applyMode,
    },
  });
}

export async function removeAppliedSkill({ input, targetStore }) {
  const steps = ["ValidatingInput", "CheckingRemovePolicy"];
  const decision = decideRemovePolicy({
    requestedOperation: "remove-applied-skill",
    wouldDeleteSource: false,
    isExternal: input.appliedSkill.kind === "external",
  });

  if (!decision.allow) {
    return removeBlocked({
      appliedSkill: input.appliedSkill,
      target: input.target,
      decision,
      steps: [...steps, "RemoveBlocked"],
    });
  }

  steps.push("RemovingTarget");
  const removeResult = await targetStore.removeTargetEntry({
    targetPath: input.appliedSkill.targetPath,
  });

  if (!removeResult.ok) {
    return removeBlocked({
      appliedSkill: input.appliedSkill,
      target: input.target,
      decision: removeResult.error,
      steps: [...steps, "RemoveFailed"],
    });
  }

  return {
    ok: true,
    removed: {
      skillName: input.appliedSkill.name,
      targetId: input.target.id,
      removedPath: removeResult.removedPath,
      removedKind: removeResult.removedKind,
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.remove.completed",
        skillName: input.appliedSkill.name,
        targetId: input.target.id,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

function applyBlocked({ source, target, decision, steps }) {
  return {
    ok: false,
    applied: null,
    diagnostics: [decision],
    events: [
      {
        level: "ProductLog",
        code: "skill.apply.blocked",
        skillName: source.name,
        targetId: target.id,
        reason: decision.code,
      },
    ],
    steps,
  };
}

function normalizeApplyWriteFailure(error) {
  if (error?.code !== "target-overwrite-rejected") {
    return error;
  }

  return {
    ...error,
    category: "conflict",
    riskLevel: "low",
    message: "Target destination already exists. Existing target was preserved.",
    recommendation:
      "Back up, move, or remove the existing target skill before applying this source.",
    preservationPolicy: "preserve-existing-target",
  };
}

function removeBlocked({ appliedSkill, target, decision, steps }) {
  return {
    ok: false,
    removed: null,
    diagnostics: [decision],
    events: [
      {
        level: "ProductLog",
        code: "skill.remove.blocked",
        skillName: appliedSkill.name,
        targetId: target.id,
        reason: decision.code,
      },
    ],
    steps,
  };
}
