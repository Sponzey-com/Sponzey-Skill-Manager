import test from "node:test";
import assert from "node:assert/strict";

import {
  backupAppliedSkillToMainRepository,
  copyAppliedSkillToMainRepository,
  moveAppliedSkillToMainRepository,
} from "../../src/application/transfer/transfer-use-cases.js";

test("copyAppliedSkillToMainRepository copies target skill to main repository source", async () => {
  const calls = [];
  const result = await copyAppliedSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      target: globalTarget(),
      appliedSkill: appliedExternalSkill(),
      sourceName: "external",
    },
    skillRepository: {
      async copyTargetSkillToMainRepository(input) {
        calls.push(["copyTargetSkillToMainRepository", input]);
        return {
          ok: true,
          source: {
            id: "external",
            name: "external",
            sourcePath: "/repo/skills/external",
          },
        };
      },
    },
  });

  assert.deepEqual(calls, [
    [
      "copyTargetSkillToMainRepository",
      {
        repositoryPath: "/repo",
        targetSkillPath: "/global/external",
        skillName: "external",
        origin: {
          type: "target-copy",
          targetId: "global:codex",
          targetPath: "/global/external",
        },
      },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    source: {
      id: "external",
      name: "external",
      sourcePath: "/repo/skills/external",
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.copy.completed",
        skillName: "external",
        targetId: "global:codex",
      },
    ],
    steps: [
      "ValidatingInput",
      "LoadingTargetSkill",
      "CheckingNameConflict",
      "WritingMainRepository",
      "WritingTransferMetadata",
      "Completed",
    ],
  });
});

test("backupAppliedSkillToMainRepository snapshots target without cleanup", async () => {
  const calls = [];
  const result = await backupAppliedSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      target: globalTarget(),
      appliedSkill: appliedExternalSkill(),
      snapshotId: "2026-06-28T00-00-00Z",
    },
    skillRepository: {
      async backupTargetSkillToMainRepository(input) {
        calls.push(["backupTargetSkillToMainRepository", input]);
        return {
          ok: true,
          backup: {
            skillName: "external",
            snapshotId: "2026-06-28T00-00-00Z",
            backupPath: "/repo/backups/external/2026-06-28T00-00-00Z",
          },
        };
      },
    },
  });

  assert.deepEqual(calls, [
    [
      "backupTargetSkillToMainRepository",
      {
        repositoryPath: "/repo",
        targetSkillPath: "/global/external",
        skillName: "external",
        snapshotId: "2026-06-28T00-00-00Z",
        metadata: {
          type: "target-backup",
          targetId: "global:codex",
          targetPath: "/global/external",
          skillName: "external",
          snapshotId: "2026-06-28T00-00-00Z",
        },
      },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    backup: {
      skillName: "external",
      snapshotId: "2026-06-28T00-00-00Z",
      backupPath: "/repo/backups/external/2026-06-28T00-00-00Z",
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.backup.completed",
        skillName: "external",
        targetId: "global:codex",
        snapshotId: "2026-06-28T00-00-00Z",
      },
    ],
    steps: [
      "ValidatingInput",
      "LoadingTargetSkill",
      "WritingBackupSnapshot",
      "WritingTransferMetadata",
      "Completed",
    ],
  });
});

test("copyAppliedSkillToMainRepository returns conflict without overwrite", async () => {
  const result = await copyAppliedSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      target: globalTarget(),
      appliedSkill: appliedExternalSkill(),
      sourceName: "external",
    },
    skillRepository: {
      async copyTargetSkillToMainRepository() {
        return {
          ok: false,
          error: {
            code: "source-name-conflict",
            severity: "error",
            message: "Source skill already exists.",
          },
        };
      },
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "source-name-conflict");
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "LoadingTargetSkill",
    "CheckingNameConflict",
    "NameConflictBlocked",
  ]);
});

test("moveAppliedSkillToMainRepository requires explicit cleanup confirmation", async () => {
  let copyCalled = false;
  let removeCalled = false;
  const result = await moveAppliedSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      target: globalTarget(),
      appliedSkill: appliedExternalSkill(),
      sourceName: "external",
      cleanupConfirmed: false,
    },
    skillRepository: {
      async copyTargetSkillToMainRepository() {
        copyCalled = true;
        return { ok: true };
      },
    },
    targetStore: {
      async removeTargetEntry() {
        removeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(copyCalled, false);
  assert.equal(removeCalled, false);
  assert.deepEqual(result, {
    ok: false,
    moved: null,
    diagnostics: [
      {
        code: "cleanup-confirmation-required",
        severity: "error",
        message: "Move requires explicit target cleanup confirmation.",
      },
    ],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.move.blocked",
        skillName: "external",
        targetId: "global:codex",
        reason: "cleanup-confirmation-required",
      },
    ],
    steps: [
      "ValidatingInput",
      "CheckingCleanupConfirmation",
      "CleanupConfirmationRequired",
    ],
  });
});

test("moveAppliedSkillToMainRepository copies to main before removing target", async () => {
  const calls = [];
  const result = await moveAppliedSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      target: globalTarget(),
      appliedSkill: appliedExternalSkill(),
      sourceName: "external",
      cleanupConfirmed: true,
    },
    skillRepository: {
      async copyTargetSkillToMainRepository(input) {
        calls.push(["copyTargetSkillToMainRepository", input]);
        return {
          ok: true,
          source: {
            id: "external",
            name: "external",
            sourcePath: "/repo/skills/external",
          },
        };
      },
    },
    targetStore: {
      async removeTargetEntry(input) {
        calls.push(["removeTargetEntry", input]);
        return {
          ok: true,
          removedPath: "/global/external",
          removedKind: "directory",
        };
      },
    },
  });

  assert.deepEqual(
    calls.map((call) => call[0]),
    ["copyTargetSkillToMainRepository", "removeTargetEntry"],
  );
  assert.deepEqual(result, {
    ok: true,
    moved: {
      source: {
        id: "external",
        name: "external",
        sourcePath: "/repo/skills/external",
      },
      removed: {
        removedPath: "/global/external",
        removedKind: "directory",
      },
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.transfer.move.completed",
        skillName: "external",
        targetId: "global:codex",
      },
    ],
    steps: [
      "ValidatingInput",
      "CheckingCleanupConfirmation",
      "LoadingTargetSkill",
      "CheckingNameConflict",
      "WritingMainRepository",
      "OptionalTargetCleanup",
      "Completed",
    ],
  });
});

test("moveAppliedSkillToMainRepository does not cleanup target after copy conflict", async () => {
  let removeCalled = false;
  const result = await moveAppliedSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      target: globalTarget(),
      appliedSkill: appliedExternalSkill(),
      sourceName: "external",
      cleanupConfirmed: true,
    },
    skillRepository: {
      async copyTargetSkillToMainRepository() {
        return {
          ok: false,
          error: {
            code: "source-name-conflict",
            severity: "error",
            message: "Source skill already exists.",
          },
        };
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
  assert.equal(result.diagnostics[0].code, "source-name-conflict");
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "CheckingCleanupConfirmation",
    "LoadingTargetSkill",
    "CheckingNameConflict",
    "NameConflictBlocked",
  ]);
});

function globalTarget() {
  return {
    id: "global:codex",
    clientType: "codex",
    scope: "global",
    targetPath: "/global",
  };
}

function appliedExternalSkill() {
  return {
    name: "external",
    kind: "external",
    targetPath: "/global/external",
    sourceId: null,
  };
}
