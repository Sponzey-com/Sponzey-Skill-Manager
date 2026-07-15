import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildVsixCandidateFileName,
  evaluateVsixCandidatePackaging,
} from "../../scripts/package-vsix-candidate.mjs";

test("VSIX candidate packaging check skips without running network install when local vsce is missing", async () => {
  const attemptedCommands = [];

  const result = await evaluateVsixCandidatePackaging({
    cwd: "/repo",
    mode: "check",
    async checkFile(filePath) {
      assert.equal(filePath, "/repo/node_modules/.bin/vsce");
      throw new Error("missing local vsce");
    },
    async runCommand(command) {
      attemptedCommands.push(command);
      return { ok: false };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    status: "skipped",
    code: "PackagingToolMissing",
    checked: "packaging",
    toolPath: "/repo/node_modules/.bin/vsce",
    message:
      "Local VSIX packaging skipped because node_modules/.bin/vsce was not found. Install @vscode/vsce as a dev dependency before creating a local VSIX candidate.",
  });
  assert.deepEqual(attemptedCommands, []);
});

test("VSIX candidate packaging check reports local tool availability without packaging", async () => {
  const attemptedCommands = [];

  const result = await evaluateVsixCandidatePackaging({
    cwd: "/repo",
    mode: "check",
    async checkFile(filePath) {
      assert.equal(filePath, "/repo/node_modules/.bin/vsce");
    },
    async runCommand(command) {
      attemptedCommands.push(command);
      return { ok: true };
    },
  });

  assert.deepEqual(result, {
    ok: true,
    status: "available",
    code: "PackagingToolAvailable",
    checked: "packaging",
    toolPath: "/repo/node_modules/.bin/vsce",
    message: "Local VSIX packaging tool is available.",
  });
  assert.deepEqual(attemptedCommands, []);
});

test("VSIX candidate packaging uses local vsce binary and deterministic output path", async () => {
  const createdDirectories = [];
  const commands = [];

  const result = await evaluateVsixCandidatePackaging({
    cwd: "/repo",
    mode: "package",
    async checkFile(filePath) {
      assert.equal(filePath, "/repo/node_modules/.bin/vsce");
    },
    async makeDirectory(directoryPath) {
      createdDirectories.push(directoryPath);
    },
    async readTextFile(filePath) {
      assert.equal(filePath, "/repo/package.json");
      return JSON.stringify({
        name: "sponzey-skills-manager",
        version: "0.0.0",
      });
    },
    async runCommand(command) {
      commands.push(command);
      return { ok: true, code: 0 };
    },
  });

  assert.deepEqual(createdDirectories, ["/repo/.dist"]);
  assert.deepEqual(commands, [
    {
      command: "/repo/node_modules/.bin/vsce",
      args: ["package", "--out", "/repo/.dist/sponzey-skills-manager-0.0.0.vsix"],
    },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.status, "packaged");
  assert.equal(result.outputPath, "/repo/.dist/sponzey-skills-manager-0.0.0.vsix");
});

test("VSIX candidate packaging returns machine-readable failure when local package command fails", async () => {
  const result = await evaluateVsixCandidatePackaging({
    cwd: "/repo",
    mode: "package",
    async checkFile() {},
    async makeDirectory() {},
    async readTextFile() {
      return JSON.stringify({
        name: "sponzey-skills-manager",
        version: "0.0.0",
      });
    },
    async runCommand() {
      return { ok: false, code: 2 };
    },
  });

  assert.deepEqual(result, {
    ok: false,
    status: "failed",
    code: "PackageFailed",
    checked: "packaging",
    toolPath: "/repo/node_modules/.bin/vsce",
    outputPath: "/repo/.dist/sponzey-skills-manager-0.0.0.vsix",
    message: "Local VSIX packaging command failed.",
  });
});

test("VSIX candidate filename is derived from manifest name and version only", () => {
  assert.equal(
    buildVsixCandidateFileName({
      name: "Sponzey Skills Manager!",
      version: "0.0.0-dev+local",
    }),
    "sponzey-skills-manager-0.0.0-dev-local.vsix",
  );
});

test("VSIX packaging excludes dotenv files that may contain Marketplace credentials", async () => {
  const ignoreEntries = (await readFile(".vscodeignore", "utf8"))
    .split(/\r?\n/)
    .map((entry) => entry.trim());

  assert.ok(ignoreEntries.includes(".env"));
  assert.ok(ignoreEntries.includes(".env.*"));
});
