import test from "node:test";
import assert from "node:assert/strict";

import {
  applySkillToTarget,
  removeAppliedSkill,
} from "../../src/application/apply/apply-use-cases.js";

test("applySkillToTarget copies low risk source to target with explicit metadata", async () => {
  const calls = [];
  const source = sourceSkill();
  const target = globalTarget();
  const result = await applySkillToTarget({
    context: { defaultApplyMode: "copy" },
    input: {
      source,
      target,
      confirmationProvided: false,
    },
    analyzer: {
      async analyzeSourceSkill(input) {
        calls.push(["analyzeSourceSkill", input]);
        return { riskLevel: "low", diagnostics: [] };
      },
    },
    targetStore: {
      async copySkillToTarget(input) {
        calls.push(["copySkillToTarget", input]);
        return {
          ok: true,
          targetPath: "/global/alpha",
          metadataPath: "/global/alpha/.sponzey-applied.json",
        };
      },
    },
  });

  assert.deepEqual(calls, [
    ["analyzeSourceSkill", { source }],
    [
      "copySkillToTarget",
      {
        sourcePath: "/repo/skills/alpha",
        targetRootPath: "/global",
        skillName: "alpha",
        metadata: {
          sourceSkillId: "alpha",
          sourcePath: "/repo/skills/alpha",
          targetId: "global:codex",
          applyMode: "copy",
        },
      },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    applied: {
      skillName: "alpha",
      targetId: "global:codex",
      applyMode: "copy",
      targetPath: "/global/alpha",
    },
    diagnostics: [],
    events: [
      {
        level: "FieldDebugLog",
        code: "skill.apply.risk.accepted",
        skillName: "alpha",
        riskLevel: "low",
      },
      {
        level: "ProductLog",
        code: "skill.apply.completed",
        skillName: "alpha",
        targetId: "global:codex",
        applyMode: "copy",
      },
    ],
    steps: [
      "ValidatingInput",
      "AnalyzingRisk",
      "CheckingRiskPolicy",
      "WritingTarget",
      "VerifyingResult",
      "Completed",
    ],
  });
});

test("applySkillToTarget links low risk source when apply mode is symlink", async () => {
  const calls = [];
  const source = sourceSkill();
  const target = globalTarget();
  const result = await applySkillToTarget({
    context: { defaultApplyMode: "copy" },
    input: {
      source,
      target,
      applyMode: "symlink",
      confirmationProvided: false,
    },
    analyzer: {
      async analyzeSourceSkill(input) {
        calls.push(["analyzeSourceSkill", input]);
        return { riskLevel: "low", diagnostics: [] };
      },
    },
    targetStore: {
      async linkSkillToTarget(input) {
        calls.push(["linkSkillToTarget", input]);
        return {
          ok: true,
          targetPath: "/global/alpha",
          linkTargetPath: "/repo/skills/alpha",
        };
      },
    },
  });

  assert.deepEqual(calls, [
    ["analyzeSourceSkill", { source }],
    [
      "linkSkillToTarget",
      {
        sourcePath: "/repo/skills/alpha",
        targetRootPath: "/global",
        skillName: "alpha",
      },
    ],
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.applied.applyMode, "symlink");
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "AnalyzingRisk",
    "CheckingRiskPolicy",
    "WritingTarget",
    "VerifyingResult",
    "Completed",
  ]);
});

test("applySkillToTarget blocks critical risk before target write", async () => {
  let writeCalled = false;
  const source = sourceSkill();
  const target = globalTarget();
  const result = await applySkillToTarget({
    context: { defaultApplyMode: "copy" },
    input: { source, target },
    analyzer: {
      async analyzeSourceSkill() {
        return {
          riskLevel: "critical",
          diagnostics: [{ code: "destructive-rm-rf", severity: "critical" }],
        };
      },
    },
    targetStore: {
      async copySkillToTarget() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "critical-risk-blocked");
  assert.deepEqual(result.events, [
    {
      level: "ProductLog",
      code: "skill.apply.blocked",
      skillName: "alpha",
      targetId: "global:codex",
      reason: "critical-risk-blocked",
    },
  ]);
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "AnalyzingRisk",
    "CheckingRiskPolicy",
    "RiskBlocked",
  ]);
});

test("applySkillToTarget requires confirmation for high risk", async () => {
  let writeCalled = false;
  const result = await applySkillToTarget({
    context: { defaultApplyMode: "copy" },
    input: {
      source: sourceSkill(),
      target: globalTarget(),
      confirmationProvided: false,
    },
    analyzer: {
      async analyzeSourceSkill() {
        return { riskLevel: "high", diagnostics: [] };
      },
    },
    targetStore: {
      async copySkillToTarget() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "high-risk-confirmation-required");
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "AnalyzingRisk",
    "CheckingRiskPolicy",
    "RiskBlocked",
  ]);
});

test("removeAppliedSkill removes managed target entry only", async () => {
  const calls = [];
  const result = await removeAppliedSkill({
    input: {
      target: globalTarget(),
      appliedSkill: {
        name: "alpha",
        kind: "managed-copy",
        targetPath: "/global/alpha",
        sourceId: "alpha",
      },
    },
    targetStore: {
      async removeTargetEntry(input) {
        calls.push(["removeTargetEntry", input]);
        return {
          ok: true,
          removedPath: "/global/alpha",
          removedKind: "directory",
        };
      },
    },
  });

  assert.deepEqual(calls, [
    ["removeTargetEntry", { targetPath: "/global/alpha" }],
  ]);
  assert.deepEqual(result, {
    ok: true,
    removed: {
      skillName: "alpha",
      targetId: "global:codex",
      removedPath: "/global/alpha",
      removedKind: "directory",
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.remove.completed",
        skillName: "alpha",
        targetId: "global:codex",
      },
    ],
    steps: [
      "ValidatingInput",
      "CheckingRemovePolicy",
      "RemovingTarget",
      "Completed",
    ],
  });
});

test("removeAppliedSkill blocks external target removal by default", async () => {
  let removeCalled = false;
  const result = await removeAppliedSkill({
    input: {
      target: globalTarget(),
      appliedSkill: {
        name: "external",
        kind: "external",
        targetPath: "/global/external",
        sourceId: null,
      },
    },
    targetStore: {
      async removeTargetEntry() {
        removeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(removeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "external-remove-blocked");
  assert.deepEqual(result.events, [
    {
      level: "ProductLog",
      code: "skill.remove.blocked",
      skillName: "external",
      targetId: "global:codex",
      reason: "external-remove-blocked",
    },
  ]);
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "CheckingRemovePolicy",
    "RemoveBlocked",
  ]);
});

function sourceSkill() {
  return {
    id: "alpha",
    name: "alpha",
    sourcePath: "/repo/skills/alpha",
  };
}

function globalTarget() {
  return {
    id: "global:codex",
    clientType: "codex",
    scope: "global",
    targetPath: "/global",
  };
}
