import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRuntimeContext,
  createRuntimeContext,
} from "../../src/application/config/runtime-context-builder.js";

test("buildRuntimeContext reads external settings exactly once and returns a frozen context", async () => {
  const settingsReader = createCountingSettingsReader(validSettings());

  const result = await buildRuntimeContext({
    settingsReader,
    workspaceRoots: ["/workspace/project-a"],
  });

  assert.equal(settingsReader.readCount, 1);
  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.context), true);
  assert.equal(Object.isFrozen(result.context.globalTargets), true);
  assert.equal(result.context.mainRepositoryPath, "/tmp/sponzey-main");
  assert.deepEqual(result.context.enabledClients, ["codex", "claude"]);
  assert.deepEqual(result.diagnostics, []);
});

test("createRuntimeContext can build context from explicit settings without a settings reader", () => {
  const result = createRuntimeContext({
    settings: validSettings(),
    workspaceRoots: ["/workspace/project-a"],
  });

  assert.equal(result.ok, true);
  assert.equal(result.context.defaultApplyMode, "symlink");
});

test("runtime context merges active standard targets with configured targets and removes normalized duplicates", () => {
  const result = createRuntimeContext({
    settings: {
      ...validSettings(),
      enabledClients: ["codex"],
      globalTargets: [
        {
          id: "configured-codex",
          clientType: "codex",
          scope: "global",
          targetPath: "/home/test/.agents/skills/",
        },
      ],
      projectTargetPatterns: [".agents/skills", ".claude/skills"],
    },
    workspaceRoots: ["/workspace/project-a"],
    standardGlobalTargets: [
      {
        id: "standard-codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/home/test/.agents/skills",
      },
      {
        id: "standard-claude",
        clientType: "claude",
        scope: "global",
        targetPath: "/home/test/.claude/skills",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.context.globalTargets.map((target) => ({
      id: target.id,
      clientType: target.clientType,
      origin: target.origin,
      targetPath: target.targetPath,
    })),
    [
      {
        id: "configured-codex",
        clientType: "codex",
        origin: "configured",
        targetPath: "/home/test/.agents/skills",
      },
    ],
  );
  assert.deepEqual(
    result.context.projectTargets.map((target) => [
      target.clientType,
      target.origin,
      target.targetPath,
    ]),
    [["codex", "standard", "/workspace/project-a/.agents/skills"]],
  );
  assert.equal(
    Object.isFrozen(result.context.globalTargets[0].capabilities),
    true,
  );
});

test("explicit codex legacy target is discovery-only compatibility target", () => {
  const result = createRuntimeContext({
    settings: {
      ...validSettings(),
      globalTargets: [
        {
          id: "legacy-codex",
          clientType: "codex",
          scope: "global",
          targetPath: "/home/test/.codex/skills",
        },
      ],
      projectTargetPatterns: [],
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.context.globalTargets[0].origin, "compatibility");
  assert.deepEqual(result.context.globalTargets[0].capabilities, {
    discoverable: true,
    applyable: false,
    removable: false,
    movable: false,
    copyable: true,
    backupable: true,
  });
});

test("invalid default apply mode returns machine-readable validation diagnostic", () => {
  const result = createRuntimeContext({
    settings: {
      ...validSettings(),
      defaultApplyMode: "runtime-mutated-mode",
    },
    workspaceRoots: ["/workspace/project-a"],
  });

  assert.equal(result.ok, false);
  assert.equal(result.context, null);
  assert.deepEqual(result.diagnostics, [
    {
      code: "invalid-default-apply-mode",
      severity: "error",
      productLogEvent: "runtime.context.validation.failed",
      fieldDebugEvent: "config.validation.detail",
      message: "Default apply mode must be symlink or copy.",
    },
  ]);
});

test("empty main repository path does not create target overlap diagnostics", () => {
  const result = createRuntimeContext({
    settings: {
      ...validSettings(),
      mainRepositoryPath: "",
      projectTargetPatterns: [".agents/skills"],
    },
    workspaceRoots: ["/workspace/project-a"],
  });

  assert.equal(result.ok, true);
  assert.equal(result.context.mainRepositoryPath, "");
  assert.deepEqual(result.diagnostics, []);
});

test("main repository path cannot equal a global target path", () => {
  const result = createRuntimeContext({
    settings: {
      ...validSettings(),
      mainRepositoryPath: "/tmp/shared-skills",
      globalTargets: [
        {
          id: "codex-global",
          clientType: "codex",
          scope: "global",
          targetPath: "/tmp/shared-skills",
        },
      ],
    },
    workspaceRoots: ["/workspace/project-a"],
  });

  assert.equal(result.ok, false);
  assert.equal(result.context, null);
  assert.equal(result.diagnostics[0].code, "main-repository-overlaps-target");
  assert.equal(result.diagnostics[0].relation, "equal");
  assert.equal(
    result.diagnostics[0].productLogEvent,
    "runtime.context.validation.failed",
  );
});

test("main repository path cannot be inside a project target path", () => {
  const result = createRuntimeContext({
    settings: {
      ...validSettings(),
      mainRepositoryPath: "/workspace/project-a/.agents/skills/main",
      projectTargetPatterns: [".agents/skills"],
    },
    workspaceRoots: ["/workspace/project-a"],
  });

  assert.equal(result.ok, false);
  assert.equal(result.context, null);
  assert.equal(result.diagnostics[0].code, "main-repository-overlaps-target");
  assert.equal(result.diagnostics[0].relation, "main-inside-target");
});

function createCountingSettingsReader(settings) {
  return {
    readCount: 0,
    readSettings() {
      this.readCount += 1;
      return settings;
    },
  };
}

function validSettings() {
  return {
    mainRepositoryPath: "/tmp/sponzey-main",
    enabledClients: ["codex", "claude"],
    globalTargets: [
      {
        id: "codex-global",
        clientType: "codex",
        scope: "global",
        targetPath: "/tmp/codex-global-skills",
      },
      {
        id: "claude-global",
        clientType: "claude",
        scope: "global",
        targetPath: "/tmp/claude-global-skills",
      },
    ],
    projectTargetPatterns: [".agents/skills", ".claude/skills"],
    defaultApplyMode: "symlink",
    riskPolicy: {
      blockCriticalRiskApply: true,
      warnHighRiskApply: true,
    },
    backupPolicy: {
      relativePath: "backups",
      defaultAppliedSkillImportMode: "backup",
      removeTargetAfterMoveToMain: false,
    },
    loggingPolicy: {
      fieldDebugEnabled: false,
      developmentLogEnabled: false,
    },
  };
}
