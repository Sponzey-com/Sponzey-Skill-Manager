import test from "node:test";
import assert from "node:assert/strict";

import {
  createSkillName,
  createSkillSource,
  createSkillTarget,
  calculateSyncStatus,
  decideApplyConflictPolicy,
  decideRemovePolicy,
  decideRiskPolicy,
  decideTransferPolicy,
  evaluateRepositoryPathPolicy,
} from "../../src/domain/index.js";

test("domain value objects and entities are frozen and framework independent", () => {
  const name = createSkillName(" code-reviewer ");
  assert.equal(name.ok, true);
  assert.equal(name.value.value, "code-reviewer");
  assert.equal(Object.isFrozen(name.value), true);

  const source = createSkillSource({
    id: "skill_001",
    name: name.value,
    sourcePath: "/tmp/main/skills/code-reviewer",
  });

  const target = createSkillTarget({
    id: "target_001",
    clientType: "codex",
    scope: "global",
    targetPath: "/tmp/global/.agents/skills",
  });

  assert.equal(source.ok, true);
  assert.equal(target.ok, true);
  assert.equal(Object.isFrozen(source.value), true);
  assert.equal(Object.isFrozen(target.value), true);
});

test("empty skill name returns machine-readable diagnostic", () => {
  const result = createSkillName(" ");

  assert.equal(result.ok, false);
  assert.deepEqual(result.diagnostics, [
    {
      code: "invalid-skill-name",
      severity: "error",
      message: "Skill name must not be empty.",
    },
  ]);
});

test("repository path policy blocks main repository and target overlap", () => {
  const result = evaluateRepositoryPathPolicy({
    mainRepositoryPath: "/tmp/shared-skills",
    targetPaths: ["/tmp/shared-skills"],
  });

  assert.equal(result.allow, false);
  assert.equal(result.decisions[0].code, "main-repository-overlaps-target");
  assert.equal(result.decisions[0].relation, "equal");
});

test("remove policy blocks source deletion", () => {
  const decision = decideRemovePolicy({
    requestedOperation: "remove-applied-skill",
    wouldDeleteSource: true,
  });

  assert.deepEqual(decision, {
    allow: false,
    code: "remove-cannot-delete-source",
    severity: "error",
    message: "Remove operation must not delete the source skill.",
  });
});

test("remove policy blocks external target removal by default", () => {
  const decision = decideRemovePolicy({
    requestedOperation: "remove-applied-skill",
    wouldDeleteSource: false,
    isExternal: true,
  });

  assert.deepEqual(decision, {
    allow: false,
    code: "external-remove-blocked",
    severity: "error",
    message: "External target skill removal is blocked by default.",
  });
});

test("transfer policy keeps backup target immutable", () => {
  const decision = decideTransferPolicy({
    operationType: "backup-to-main",
    wouldMutateTarget: true,
  });

  assert.deepEqual(decision, {
    allow: false,
    code: "backup-cannot-mutate-target",
    severity: "error",
    message: "Backup operation must not mutate the target skill.",
  });
});

test("risk policy blocks critical risk and requires confirmation for high risk", () => {
  assert.deepEqual(decideRiskPolicy({ riskLevel: "critical" }), {
    allow: false,
    requiresConfirmation: false,
    code: "critical-risk-blocked",
    severity: "critical",
    message: "Critical risk skills must be blocked before target write.",
  });

  assert.deepEqual(
    decideRiskPolicy({ riskLevel: "high", confirmationProvided: false }),
    {
      allow: false,
      requiresConfirmation: true,
      code: "high-risk-confirmation-required",
      severity: "high",
      message: "High risk skills require explicit confirmation.",
    },
  );

  assert.equal(
    decideRiskPolicy({ riskLevel: "low", confirmationProvided: false }).allow,
    true,
  );
});

test("apply conflict policy blocks overwriting external targets", () => {
  const decision = decideApplyConflictPolicy({
    existingTargetKind: "external",
  });

  assert.deepEqual(decision, {
    allow: false,
    code: "external-target-overwrite-forbidden",
    severity: "error",
    message: "External target skill must not be overwritten by default.",
  });
});

test("sync status policy classifies copy drift and external states", () => {
  assert.equal(
    calculateSyncStatus({
      kind: "managed-copy",
      sourceHash: "a",
      targetHash: "b",
      currentSourceHash: "a",
      currentTargetHash: "b",
    }),
    "In Sync",
  );
  assert.equal(
    calculateSyncStatus({
      kind: "managed-copy",
      sourceHash: "a",
      targetHash: "b",
      currentSourceHash: "next",
      currentTargetHash: "b",
    }),
    "Source Changed",
  );
  assert.equal(
    calculateSyncStatus({
      kind: "managed-copy",
      sourceHash: "a",
      targetHash: "b",
      currentSourceHash: "a",
      currentTargetHash: "next",
    }),
    "Target Changed",
  );
  assert.equal(
    calculateSyncStatus({
      kind: "managed-copy",
      sourceHash: "a",
      targetHash: "b",
      currentSourceHash: "next",
      currentTargetHash: "next",
    }),
    "Both Changed",
  );
  assert.equal(
    calculateSyncStatus({
      kind: "managed-copy",
      sourceExists: false,
    }),
    "Missing Source",
  );
  assert.equal(calculateSyncStatus({ kind: "external" }), "External");
  assert.equal(calculateSyncStatus({ kind: "broken-symlink" }), "Broken Symlink");
});
