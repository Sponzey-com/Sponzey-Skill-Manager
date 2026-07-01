import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  SPONZEY_COMMANDS,
  createCommandHandlers,
  createUseCaseCommandHandlers,
  registerSponzeyCommands,
} from "../../src/presentation/command-registry.js";

test("presentation command descriptors match package command contributions", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const contributedCommands = packageJson.contributes.commands.map((command) => ({
    command: command.command,
    title: command.title,
  }));

  assert.deepEqual(
    contributedCommands,
    SPONZEY_COMMANDS.map((command) => ({
      command: command.id,
      title: command.title,
    })),
  );
});

test("registerSponzeyCommands registers every command with command API", () => {
  const registered = [];
  const disposables = registerSponzeyCommands({
    commandsApi: {
      registerCommand(commandId, handler) {
        registered.push([commandId, handler]);
        return { dispose() {} };
      },
    },
    handlers: createCommandHandlers(),
  });

  assert.deepEqual(
    registered.map(([commandId]) => commandId),
    SPONZEY_COMMANDS.map((command) => command.id),
  );
  assert.equal(registered.every(([, handler]) => typeof handler === "function"), true);
  assert.equal(disposables.length, SPONZEY_COMMANDS.length);
});

test("use case command handlers pass context and arguments to refresh use case", async () => {
  const calls = [];
  const handlers = createUseCaseCommandHandlers({
    async getContext() {
      calls.push(["getContext"]);
      return { mainRepositoryPath: "/repo" };
    },
    useCases: {
      async refreshSkills(input) {
        calls.push(["refreshSkills", input]);
        return { ok: true, readModel: {} };
      },
    },
  });

  const result = await handlers["sponzeySkills.refreshSkills"]({
    force: true,
  });

  assert.deepEqual(calls, [
    ["getContext"],
    [
      "refreshSkills",
      {
        context: { mainRepositoryPath: "/repo" },
        input: { force: true },
      },
    ],
  ]);
  assert.deepEqual(result, { ok: true, readModel: {} });
});

test("use case command handlers pass create arguments as input DTO", async () => {
  const calls = [];
  const handlers = createUseCaseCommandHandlers({
    async getContext() {
      return { mainRepositoryPath: "/repo" };
    },
    useCases: {
      async createSkill(input) {
        calls.push(input);
        return { ok: true };
      },
    },
  });

  await handlers["sponzeySkills.createSkill"]({
    name: "helper",
    description: "Use this skill when writing helper code.",
  });

  assert.deepEqual(calls, [
    {
      context: { mainRepositoryPath: "/repo" },
      input: {
        name: "helper",
        description: "Use this skill when writing helper code.",
      },
    },
  ]);
});

test("use case command handlers map backup compare command to compare use case", async () => {
  const calls = [];
  const handlers = createUseCaseCommandHandlers({
    async getContext() {
      return { mainRepositoryPath: "/repo" };
    },
    useCases: {
      async compareSkillBackup(input) {
        calls.push(input);
        return { ok: true };
      },
    },
  });

  await handlers["sponzeySkills.compareSkillBackup"]({
    backupPath: "/repo/backups/alpha/snapshot-001",
    referencePath: "/repo/skills/alpha",
  });

  assert.deepEqual(calls, [
    {
      context: { mainRepositoryPath: "/repo" },
      input: {
        backupPath: "/repo/backups/alpha/snapshot-001",
        referencePath: "/repo/skills/alpha",
      },
    },
  ]);
});

test("use case command handlers map backup restore command to restore use case", async () => {
  const calls = [];
  const handlers = createUseCaseCommandHandlers({
    async getContext() {
      return { mainRepositoryPath: "/repo" };
    },
    useCases: {
      async restoreBackupToTarget(input) {
        calls.push(input);
        return { ok: true };
      },
    },
  });

  await handlers["sponzeySkills.restoreBackupToTarget"]({
    backupPath: "/repo/backups/alpha/snapshot-001",
    target: {
      id: "global:codex",
      targetPath: "/global",
    },
    overwriteConfirmed: true,
  });

  assert.deepEqual(calls, [
    {
      context: { mainRepositoryPath: "/repo" },
      input: {
        backupPath: "/repo/backups/alpha/snapshot-001",
        target: {
          id: "global:codex",
          targetPath: "/global",
        },
        overwriteConfirmed: true,
      },
    },
  ]);
});

test("use case command handlers return typed result when use case is not wired", async () => {
  const handlers = createUseCaseCommandHandlers({
    async getContext() {
      return { mainRepositoryPath: "/repo" };
    },
    useCases: {},
  });

  const result = await handlers["sponzeySkills.createSkill"]({ name: "helper" });

  assert.deepEqual(result, {
    ok: false,
    code: "command-handler-not-wired",
    commandId: "sponzeySkills.createSkill",
  });
});
