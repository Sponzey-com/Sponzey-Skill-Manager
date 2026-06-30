import test from "node:test";
import assert from "node:assert/strict";

import {
  addGlobalRepository,
  addProjectRepository,
  openMainRepository,
  removeGlobalRepository,
  setMainRepository,
  removeMainRepository,
  removeProjectRepository,
  showDiagnostics,
} from "../../src/application/index.js";

test("setMainRepository writes explicit repository path through settings writer", async () => {
  const calls = [];
  const result = await setMainRepository({
    input: {
      mainRepositoryPath: "/new-repo",
    },
    settingsWriter: {
      async updateMainRepositoryPath(input) {
        calls.push(input);
        return {
          ok: true,
          mainRepositoryPath: input.mainRepositoryPath,
        };
      },
    },
  });

  assert.deepEqual(calls, [{ mainRepositoryPath: "/new-repo" }]);
  assert.deepEqual(result, {
    ok: true,
    mainRepositoryPath: "/new-repo",
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "repository.setup.completed",
      },
    ],
    steps: ["ValidatingInput", "WritingSettings", "Completed"],
  });
});

test("setMainRepository rejects missing path before writing settings", async () => {
  let writeCalled = false;
  const result = await setMainRepository({
    input: {},
    settingsWriter: {
      async updateMainRepositoryPath() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "invalid-main-repository-path");
  assert.deepEqual(result.steps, ["ValidatingInput", "ValidationFailed"]);
});

test("setMainRepository initializes repository before writing settings when adapter is available", async () => {
  const calls = [];
  const result = await setMainRepository({
    input: {
      mainRepositoryPath: "/new-repo",
    },
    skillRepository: {
      async initializeRepository(input) {
        calls.push(["initializeRepository", input]);
        return { ok: true };
      },
    },
    settingsWriter: {
      async updateMainRepositoryPath(input) {
        calls.push(["updateMainRepositoryPath", input]);
        return {
          ok: true,
          mainRepositoryPath: input.mainRepositoryPath,
        };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    ["initializeRepository", { repositoryPath: "/new-repo" }],
    ["updateMainRepositoryPath", { mainRepositoryPath: "/new-repo" }],
  ]);
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "InitializingRepository",
    "WritingSettings",
    "Completed",
  ]);
});

test("setMainRepository rejects agent target-like repository paths", async () => {
  let writeCalled = false;
  const result = await setMainRepository({
    input: {
      mainRepositoryPath: "/Users/example/.agents/skills",
    },
    settingsWriter: {
      async updateMainRepositoryPath() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "main-repository-path-target-like");
  assert.deepEqual(result.steps, ["ValidatingInput", "PathRejected"]);
});

test("removeMainRepository clears main repository path through settings writer", async () => {
  const calls = [];
  const result = await removeMainRepository({
    input: {
      confirmationProvided: true,
    },
    settingsWriter: {
      async clearMainRepositoryPath() {
        calls.push(["clearMainRepositoryPath"]);
        return {
          ok: true,
          mainRepositoryPath: "",
        };
      },
    },
  });

  assert.deepEqual(calls, [["clearMainRepositoryPath"]]);
  assert.deepEqual(result, {
    ok: true,
    mainRepositoryPath: "",
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "mainRepository.remove.completed",
      },
    ],
    steps: ["CheckingConfirmation", "WritingSettings", "Completed"],
  });
});

test("removeMainRepository requires explicit confirmation", async () => {
  let writeCalled = false;
  const result = await removeMainRepository({
    input: {},
    settingsWriter: {
      async clearMainRepositoryPath() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "main-repository-remove-confirmation-required");
});

test("addGlobalRepository writes explicit global target through settings writer", async () => {
  const calls = [];
  const result = await addGlobalRepository({
    input: {
      targetPath: "/global/codex",
      clientType: "codex",
    },
    settingsWriter: {
      async addGlobalTarget(input) {
        calls.push(input);
        return {
          ok: true,
          target: {
            id: "global:codex:/global/codex",
            clientType: "codex",
            scope: "global",
            targetPath: "/global/codex",
          },
        };
      },
    },
  });

  assert.deepEqual(calls, [
    {
      targetPath: "/global/codex",
      clientType: "codex",
    },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.target.id, "global:codex:/global/codex");
  assert.equal(result.events[0].code, "globalRepository.add.completed");
});

test("addGlobalRepository writes multiple global targets through batch settings writer", async () => {
  const calls = [];
  const result = await addGlobalRepository({
    input: {
      targets: [
        {
          targetPath: "/global/codex",
          clientType: "codex",
        },
        {
          targetPath: "/global/claude",
          clientType: "claude",
        },
      ],
    },
    settingsWriter: {
      async addGlobalTargets(input) {
        calls.push(input);
        return {
          ok: true,
          targets: input.targets.map((target) => ({
            id: `global:${target.clientType}:${target.targetPath}`,
            scope: "global",
            ...target,
          })),
        };
      },
    },
  });

  assert.deepEqual(calls, [
    {
      targets: [
        {
          targetPath: "/global/codex",
          clientType: "codex",
        },
        {
          targetPath: "/global/claude",
          clientType: "claude",
        },
      ],
    },
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.targets.map((target) => target.clientType),
    ["codex", "claude"],
  );
  assert.equal(result.events[0].targetCount, 2);
});

test("removeGlobalRepository removes selected global target through settings writer", async () => {
  const calls = [];
  const result = await removeGlobalRepository({
    input: {
      targetId: "global:codex:/global/codex",
    },
    settingsWriter: {
      async removeGlobalTarget(input) {
        calls.push(input);
        return {
          ok: true,
          removedTargetId: input.targetId,
        };
      },
    },
  });

  assert.deepEqual(calls, [
    {
      targetId: "global:codex:/global/codex",
    },
  ]);
  assert.deepEqual(result, {
    ok: true,
    removedTargetId: "global:codex:/global/codex",
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "globalRepository.remove.completed",
      },
    ],
    steps: ["ValidatingInput", "WritingSettings", "Completed"],
  });
});

test("addProjectRepository writes target pattern through settings writer", async () => {
  const calls = [];
  const result = await addProjectRepository({
    input: {
      targetPattern: ".codex/skills",
    },
    settingsWriter: {
      async addProjectTargetPattern(input) {
        calls.push(input);
        return {
          ok: true,
          targetPattern: input.targetPattern,
        };
      },
    },
  });

  assert.deepEqual(calls, [{ targetPattern: ".codex/skills" }]);
  assert.equal(result.ok, true);
  assert.equal(result.targetPattern, ".codex/skills");
  assert.equal(result.events[0].code, "projectRepository.add.completed");
});

test("addProjectRepository writes multiple target patterns through batch settings writer", async () => {
  const calls = [];
  const result = await addProjectRepository({
    input: {
      targetPatterns: [".agents/skills", ".claude/skills"],
    },
    settingsWriter: {
      async addProjectTargetPatterns(input) {
        calls.push(input);
        return {
          ok: true,
          targetPatterns: input.targetPatterns,
        };
      },
    },
  });

  assert.deepEqual(calls, [
    {
      targetPatterns: [".agents/skills", ".claude/skills"],
    },
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.targetPatterns, [".agents/skills", ".claude/skills"]);
  assert.equal(result.events[0].targetPatternCount, 2);
});

test("removeProjectRepository removes selected target pattern through settings writer", async () => {
  const calls = [];
  const result = await removeProjectRepository({
    input: {
      targetPattern: ".agents/skills",
    },
    settingsWriter: {
      async removeProjectTargetPattern(input) {
        calls.push(input);
        return {
          ok: true,
          removedTargetPattern: input.targetPattern,
        };
      },
    },
  });

  assert.deepEqual(calls, [{ targetPattern: ".agents/skills" }]);
  assert.equal(result.ok, true);
  assert.equal(result.removedTargetPattern, ".agents/skills");
  assert.equal(result.events[0].code, "projectRepository.remove.completed");
});

test("openMainRepository opens current runtime context repository path through opener", async () => {
  const calls = [];
  const result = await openMainRepository({
    context: {
      mainRepositoryPath: "/repo",
    },
    repositoryOpener: {
      async openPath(input) {
        calls.push(input);
        return { ok: true };
      },
    },
  });

  assert.deepEqual(calls, [{ path: "/repo" }]);
  assert.deepEqual(result, {
    ok: true,
    openedPath: "/repo",
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "mainRepository.open.completed",
      },
    ],
    steps: ["OpeningMainRepository", "Completed"],
  });
});

test("showDiagnostics returns refresh diagnostics without mutating configuration", async () => {
  const result = await showDiagnostics({
    context: {
      mainRepositoryPath: "/repo",
      globalTargets: [
        {
          id: "global:codex",
          clientType: "codex",
          scope: "global",
          targetPath: "/global",
        },
      ],
      projectTargets: [],
    },
    skillRepository: {
      async scanSourceSkills() {
        return {
          ok: true,
          sources: [],
        };
      },
    },
    targetStore: {
      async scanAppliedSkills() {
        return {
          ok: true,
          appliedSkills: [],
          diagnostics: [
            {
              code: "empty-target",
              severity: "warning",
              message: "No applied skills found.",
            },
          ],
        };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    ["empty-target"],
  );
  assert.deepEqual(result.events, [
    {
      level: "ProductLog",
      code: "diagnostics.show.completed",
      diagnosticCount: 1,
    },
  ]);
});
