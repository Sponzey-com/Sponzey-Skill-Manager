import test from "node:test";
import assert from "node:assert/strict";

import {
  createVsCodeRepositoryOpener,
  createVsCodeSettingsReader,
  createVsCodeSettingsWriter,
  readVsCodeWorkspaceRoots,
} from "../../src/infrastructure/vscode/vscode-settings-reader.js";

test("createVsCodeSettingsReader reads sponzeySkills configuration with defaults", async () => {
  const requestedKeys = [];
  const reader = createVsCodeSettingsReader({
    workspace: {
      getConfiguration(section) {
        assert.equal(section, "sponzeySkills");
        return {
          get(key, defaultValue) {
            requestedKeys.push([key, defaultValue]);
            if (key === "mainRepositoryPath") {
              return "/repo";
            }
            if (key === "globalTargets") {
              return [
                {
                  id: "global:codex",
                  clientType: "codex",
                  scope: "global",
                  targetPath: "/global",
                },
              ];
            }
            return defaultValue;
          },
        };
      },
    },
  });

  const settings = await reader.readSettings();

  assert.deepEqual(settings, {
    mainRepositoryPath: "/repo",
    enabledClients: ["codex"],
    globalTargets: [
      {
        id: "global:codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/global",
      },
    ],
    projectTargetPatterns: [".agents/skills"],
    defaultApplyMode: "copy",
    riskPolicy: {},
    backupPolicy: {},
    loggingPolicy: {},
  });
  assert.deepEqual(
    requestedKeys.map(([key]) => key),
    [
      "mainRepositoryPath",
      "enabledClients",
      "globalTargets",
      "projectTargetPatterns",
      "defaultApplyMode",
      "riskPolicy",
      "backupPolicy",
      "loggingPolicy",
    ],
  );
});

test("readVsCodeWorkspaceRoots extracts fsPath values", () => {
  assert.deepEqual(
    readVsCodeWorkspaceRoots({
      workspaceFolders: [
        { uri: { fsPath: "/workspace/one" } },
        { uri: { fsPath: "/workspace/two" } },
      ],
    }),
    ["/workspace/one", "/workspace/two"],
  );
});

test("createVsCodeSettingsWriter updates main repository path in global configuration", async () => {
  const calls = [];
  const writer = createVsCodeSettingsWriter({
    workspace: {
      getConfiguration(section) {
        assert.equal(section, "sponzeySkills");
        return {
          async update(key, value, target) {
            calls.push({ key, value, target });
          },
        };
      },
      ConfigurationTarget: {
        Global: "global",
      },
    },
  });

  const result = await writer.updateMainRepositoryPath({
    mainRepositoryPath: "/new-repo",
  });

  assert.deepEqual(calls, [
    {
      key: "mainRepositoryPath",
      value: "/new-repo",
      target: "global",
    },
  ]);
  assert.deepEqual(result, {
    ok: true,
    mainRepositoryPath: "/new-repo",
  });
});

test("createVsCodeSettingsWriter reports settings update failure cause", async () => {
  const writer = createVsCodeSettingsWriter({
    workspace: {
      getConfiguration(section) {
        assert.equal(section, "sponzeySkills");
        return {
          async update() {
            throw new Error("Unknown configuration setting.");
          },
        };
      },
      ConfigurationTarget: {
        Global: "global",
      },
    },
  });

  const result = await writer.updateMainRepositoryPath({
    mainRepositoryPath: "/new-repo",
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.error, {
    code: "settings-write-failed",
    severity: "error",
    message:
      "Failed to update main repository setting. Unknown configuration setting.",
  });
});

test("createVsCodeSettingsWriter clears main repository path", async () => {
  const calls = [];
  const writer = createVsCodeSettingsWriter({
    workspace: fakeWorkspace({
      settings: {
        mainRepositoryPath: "/repo",
      },
      calls,
    }),
  });

  const result = await writer.clearMainRepositoryPath();

  assert.deepEqual(calls, [
    {
      key: "mainRepositoryPath",
      value: "",
      target: "global",
    },
  ]);
  assert.deepEqual(result, {
    ok: true,
    mainRepositoryPath: "",
  });
});

test("createVsCodeSettingsWriter adds and removes global targets without duplicates", async () => {
  const calls = [];
  const workspace = fakeWorkspace({
    settings: {
      globalTargets: [
        {
          id: "global:codex:/existing",
          clientType: "codex",
          scope: "global",
          targetPath: "/existing",
        },
      ],
    },
    calls,
  });
  const writer = createVsCodeSettingsWriter({ workspace });

  const addResult = await writer.addGlobalTarget({
    targetPath: "/new",
    clientType: "claude",
  });
  const duplicateResult = await writer.addGlobalTarget({
    targetPath: "/new",
    clientType: "claude",
  });
  const removeResult = await writer.removeGlobalTarget({
    targetId: "global:claude:/new",
  });

  assert.equal(addResult.ok, true);
  assert.deepEqual(addResult.target, {
    id: "global:claude:/new",
    clientType: "claude",
    scope: "global",
    targetPath: "/new",
  });
  assert.equal(duplicateResult.ok, false);
  assert.equal(duplicateResult.error.code, "global-target-conflict");
  assert.deepEqual(removeResult, {
    ok: true,
    removedTargetId: "global:claude:/new",
  });
  assert.deepEqual(
    calls.map((call) => ({
      key: call.key,
      value: call.value,
      target: call.target,
    })),
    [
      {
        key: "globalTargets",
        value: [
          {
            id: "global:codex:/existing",
            clientType: "codex",
            scope: "global",
            targetPath: "/existing",
          },
          {
            id: "global:claude:/new",
            clientType: "claude",
            scope: "global",
            targetPath: "/new",
          },
        ],
        target: "global",
      },
      {
        key: "globalTargets",
        value: [
          {
            id: "global:codex:/existing",
            clientType: "codex",
            scope: "global",
            targetPath: "/existing",
          },
        ],
        target: "global",
      },
    ],
  );
});

test("createVsCodeSettingsWriter adds multiple global targets atomically", async () => {
  const calls = [];
  const workspace = fakeWorkspace({
    settings: {
      globalTargets: [],
    },
    calls,
  });
  const writer = createVsCodeSettingsWriter({ workspace });

  const result = await writer.addGlobalTargets({
    targets: [
      {
        targetPath: "/home/test/.agents/skills",
        clientType: "codex",
      },
      {
        targetPath: "/home/test/.claude/skills",
        clientType: "claude",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.targets.map((target) => target.clientType),
    ["codex", "claude"],
  );
  assert.deepEqual(calls, [
    {
      key: "globalTargets",
      value: [
        {
          id: "global:codex:/home/test/.agents/skills",
          clientType: "codex",
          scope: "global",
          targetPath: "/home/test/.agents/skills",
        },
        {
          id: "global:claude:/home/test/.claude/skills",
          clientType: "claude",
          scope: "global",
          targetPath: "/home/test/.claude/skills",
        },
      ],
      target: "global",
    },
  ]);
});

test("createVsCodeSettingsWriter adds and removes project target patterns", async () => {
  const calls = [];
  const workspace = fakeWorkspace({
    settings: {
      projectTargetPatterns: [".agents/skills"],
    },
    calls,
  });
  const writer = createVsCodeSettingsWriter({ workspace });

  const addResult = await writer.addProjectTargetPattern({
    targetPattern: ".codex/skills",
  });
  const duplicateResult = await writer.addProjectTargetPattern({
    targetPattern: ".codex/skills",
  });
  const removeResult = await writer.removeProjectTargetPattern({
    targetPattern: ".agents/skills",
  });

  assert.deepEqual(addResult, {
    ok: true,
    targetPattern: ".codex/skills",
  });
  assert.equal(duplicateResult.ok, false);
  assert.equal(duplicateResult.error.code, "project-target-pattern-conflict");
  assert.deepEqual(removeResult, {
    ok: true,
    removedTargetPattern: ".agents/skills",
  });
  assert.deepEqual(
    calls.map((call) => ({
      key: call.key,
      value: call.value,
      target: call.target,
    })),
    [
      {
        key: "projectTargetPatterns",
        value: [".agents/skills", ".codex/skills"],
        target: "global",
      },
      {
        key: "projectTargetPatterns",
        value: [".codex/skills"],
        target: "global",
      },
    ],
  );
});

test("createVsCodeSettingsWriter adds multiple project target patterns atomically", async () => {
  const calls = [];
  const workspace = fakeWorkspace({
    settings: {
      projectTargetPatterns: [],
    },
    calls,
  });
  const writer = createVsCodeSettingsWriter({ workspace });

  const result = await writer.addProjectTargetPatterns({
    targetPatterns: [".agents/skills", ".claude/skills"],
  });

  assert.deepEqual(result, {
    ok: true,
    targetPattern: ".agents/skills",
    targetPatterns: [".agents/skills", ".claude/skills"],
  });
  assert.deepEqual(calls, [
    {
      key: "projectTargetPatterns",
      value: [".agents/skills", ".claude/skills"],
      target: "global",
    },
  ]);
});

test("createVsCodeRepositoryOpener opens repository path through VSCode env", async () => {
  const calls = [];
  const opener = createVsCodeRepositoryOpener({
    env: {
      async openExternal(uri) {
        calls.push(uri);
        return true;
      },
    },
    Uri: {
      file(path) {
        return {
          scheme: "file",
          path,
        };
      },
    },
  });

  const result = await opener.openPath({ path: "/repo" });

  assert.deepEqual(calls, [{ scheme: "file", path: "/repo" }]);
  assert.deepEqual(result, {
    ok: true,
    path: "/repo",
  });
});

test("createVsCodeRepositoryOpener opens editor paths in the current VSCode window", async () => {
  const calls = [];
  const opener = createVsCodeRepositoryOpener({
    env: {
      async openExternal(uri) {
        calls.push(["external", uri]);
        return true;
      },
    },
    Uri: {
      file(path) {
        return {
          scheme: "file",
          path,
        };
      },
    },
    workspace: {
      async openTextDocument(uri) {
        calls.push(["openTextDocument", uri]);
        return {
          uri,
          languageId: "markdown",
        };
      },
    },
    window: {
      async showTextDocument(document, options) {
        calls.push(["showTextDocument", document, options]);
      },
    },
  });

  const result = await opener.openPath({
    path: "/repo/skills/alpha/SKILL.md",
    openMode: "editor",
  });

  assert.deepEqual(calls, [
    [
      "openTextDocument",
      { scheme: "file", path: "/repo/skills/alpha/SKILL.md" },
    ],
    [
      "showTextDocument",
      {
        uri: { scheme: "file", path: "/repo/skills/alpha/SKILL.md" },
        languageId: "markdown",
      },
      { preview: false },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    path: "/repo/skills/alpha/SKILL.md",
  });
});

function fakeWorkspace({ settings, calls }) {
  const currentSettings = { ...settings };

  return {
    ConfigurationTarget: {
      Global: "global",
    },
    getConfiguration(section) {
      assert.equal(section, "sponzeySkills");
      return {
        get(key, defaultValue) {
          return currentSettings[key] ?? defaultValue;
        },
        async update(key, value, target) {
          currentSettings[key] = value;
          calls.push({ key, value, target });
        },
      };
    },
  };
}
