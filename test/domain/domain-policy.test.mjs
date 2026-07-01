import test from "node:test";
import assert from "node:assert/strict";

import {
  createSkillName,
  createSkillSource,
  createSkillTarget,
  calculateSyncStatus,
  createBuiltInAnalyzerPolicyPack,
  decideApplyConflictPolicy,
  decideRemovePolicy,
  decideRiskPolicy,
  decideTransferPolicy,
  evaluateSkillNameConflictPolicy,
  evaluateSkillShadowingPolicy,
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

test("built-in analyzer policy pack exposes frozen rule catalog without external configuration", () => {
  const policyPack = createBuiltInAnalyzerPolicyPack();

  assert.equal(policyPack.id, "sponzey-built-in-analyzer-policy");
  assert.equal(policyPack.version, "builtin-policy-v1");
  assert.equal(Object.isFrozen(policyPack), true);
  assert.equal(Object.isFrozen(policyPack.rules), true);
  assert.equal(
    policyPack.rules.some((rule) => rule.code === "destructive-rm-rf"),
    true,
  );
  assert.deepEqual(
    policyPack.rules.find((rule) => rule.code === "destructive-rm-rf"),
    {
      code: "destructive-rm-rf",
      category: "security",
      severity: "critical",
      riskLevel: "critical",
      recommendation:
        "Remove destructive shell instructions or require an explicit guarded workflow.",
    },
  );
  assert.equal(
    policyPack.rules.every((rule) => Object.isFrozen(rule)),
    true,
  );
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

test("skill shadowing policy warns for same-client project over global skill", () => {
  const result = evaluateSkillShadowingPolicy({
    globalSkillGroups: [
      {
        targetId: "global:codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/global/.agents/skills",
        skills: [{ name: "alpha", kind: "managed-symlink" }],
      },
    ],
    projectSkillGroups: [
      {
        targetId: "project:/workspace:.agents/skills",
        clientType: "codex",
        scope: "project",
        targetPath: "/workspace/.agents/skills",
        skills: [{ name: "alpha", kind: "managed-copy" }],
      },
    ],
  });

  assert.deepEqual(result, {
    diagnostics: [
      {
        code: "potential-skill-shadowing",
        severity: "warning",
        category: "conflict",
        riskLevel: "low",
        message:
          "Project skill may shadow a global skill with the same name for the same client.",
        recommendation:
          "Inspect the project and global targets before applying or removing this skill.",
        skillName: "alpha",
        clientType: "codex",
        targetId: "project:/workspace:.agents/skills",
        targetPath: "/workspace/.agents/skills",
        shadowingTargetId: "project:/workspace:.agents/skills",
        shadowedTargetId: "global:codex",
      },
    ],
  });
});

test("skill shadowing policy treats same-name different-client skills as separate", () => {
  const result = evaluateSkillShadowingPolicy({
    globalSkillGroups: [
      {
        targetId: "global:codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/Users/example/.agents/skills",
        skills: [{ name: "alpha", kind: "managed-symlink" }],
      },
      {
        targetId: "global:claude",
        clientType: "claude",
        scope: "global",
        targetPath: "/Users/example/.claude/skills",
        skills: [{ name: "alpha", kind: "managed-symlink" }],
      },
    ],
    projectSkillGroups: [],
  });

  assert.deepEqual(result, {
    diagnostics: [],
  });
});

test("skill name conflict policy warns for same-name source and external target", () => {
  const result = evaluateSkillNameConflictPolicy({
    sourceSkills: [
      {
        id: "alpha",
        name: "alpha",
        sourcePath: "/repo/skills/alpha",
      },
    ],
    appliedSkillGroups: [
      {
        targetId: "global:codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/global/.agents/skills",
        skills: [
          {
            name: "alpha",
            kind: "external",
            targetPath: "/global/.agents/skills/alpha",
          },
        ],
      },
    ],
  });

  assert.deepEqual(result, {
    diagnostics: [
      {
        code: "source-target-name-conflict",
        severity: "warning",
        category: "conflict",
        riskLevel: "low",
        message:
          "A target skill with this name already exists outside main repository management.",
        recommendation:
          "Back up, move, or remove the existing target skill before applying this source.",
        skillName: "alpha",
        sourceId: "alpha",
        targetId: "global:codex",
        targetPath: "/global/.agents/skills/alpha",
        targetKind: "external",
        preservationPolicy: "preserve-existing-target",
      },
    ],
  });
});

test("skill name conflict policy ignores same-name managed targets", () => {
  const result = evaluateSkillNameConflictPolicy({
    sourceSkills: [
      {
        id: "alpha",
        name: "alpha",
        sourcePath: "/repo/skills/alpha",
      },
    ],
    appliedSkillGroups: [
      {
        targetId: "global:codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/global/.agents/skills",
        skills: [
          {
            name: "alpha",
            kind: "managed-symlink",
            targetPath: "/global/.agents/skills/alpha",
          },
        ],
      },
    ],
  });

  assert.deepEqual(result, {
    diagnostics: [],
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
