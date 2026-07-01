import test from "node:test";
import assert from "node:assert/strict";

import { LocalGitVersionControlPort } from "../../src/infrastructure/index.js";

test("LocalGitVersionControlPort parses porcelain status into relative entries", async () => {
  const commands = [];
  const port = new LocalGitVersionControlPort({
    async commandRunner(command) {
      commands.push(command);
      return {
        ok: true,
        stdout: [
          " M skills/alpha/SKILL.md",
          "A  backups/alpha/snapshot-001/SKILL.md",
          "?? .sponzey/index.json",
        ].join("\n"),
      };
    },
    clock: () => "2026-07-01T00:00:00.000Z",
  });

  const result = await port.getRepositoryStatus({
    repositoryPath: "/repo",
  });

  assert.deepEqual(commands, [
    {
      command: "git",
      args: [
        "-C",
        "/repo",
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
      ],
    },
  ]);
  assert.deepEqual(result, {
    ok: true,
    status: "dirty",
    checkedAt: "2026-07-01T00:00:00.000Z",
    entries: [
      {
        path: "skills/alpha/SKILL.md",
        status: "modified",
      },
      {
        path: "backups/alpha/snapshot-001/SKILL.md",
        status: "added",
      },
      {
        path: ".sponzey/index.json",
        status: "untracked",
      },
    ],
  });
});

test("LocalGitVersionControlPort returns clean status for empty porcelain output", async () => {
  const port = new LocalGitVersionControlPort({
    async commandRunner() {
      return {
        ok: true,
        stdout: "\n",
      };
    },
    clock: () => "2026-07-01T00:00:00.000Z",
  });

  const result = await port.getRepositoryStatus({
    repositoryPath: "/repo",
  });

  assert.deepEqual(result, {
    ok: true,
    status: "clean",
    checkedAt: "2026-07-01T00:00:00.000Z",
    entries: [],
  });
});

test("LocalGitVersionControlPort maps missing git command to unavailable diagnostic", async () => {
  const port = new LocalGitVersionControlPort({
    async commandRunner() {
      const error = new Error("missing git");
      error.code = "ENOENT";
      throw error;
    },
  });

  const result = await port.getRepositoryStatus({
    repositoryPath: "/repo",
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "git-unavailable",
      severity: "warning",
      category: "version-control",
      message: "Git command is unavailable.",
      recommendation: "Install Git to enable Main Repository version status.",
    },
  });
});

test("LocalGitVersionControlPort maps non-git repository to status instead of failure", async () => {
  const port = new LocalGitVersionControlPort({
    async commandRunner() {
      const error = new Error("not a repository");
      error.stderr = "fatal: not a git repository";
      throw error;
    },
    clock: () => "2026-07-01T00:00:00.000Z",
  });

  const result = await port.getRepositoryStatus({
    repositoryPath: "/repo",
  });

  assert.deepEqual(result, {
    ok: true,
    status: "not-git-repository",
    checkedAt: "2026-07-01T00:00:00.000Z",
    entries: [],
  });
});

test("LocalGitVersionControlPort creates snapshot commit with explicit paths", async () => {
  const commands = [];
  const port = new LocalGitVersionControlPort({
    async commandRunner(command) {
      commands.push(command);
      if (command.args.includes("rev-parse")) {
        return {
          ok: true,
          stdout: "abc123\n",
        };
      }

      return {
        ok: true,
        stdout: "",
      };
    },
  });

  const result = await port.createSnapshot({
    repositoryPath: "/repo",
    message: "Snapshot skill changes",
    paths: ["skills/alpha", ".sponzey/index.json"],
  });

  assert.deepEqual(commands, [
    {
      command: "git",
      args: [
        "-C",
        "/repo",
        "add",
        "--",
        "skills/alpha",
        ".sponzey/index.json",
      ],
    },
    {
      command: "git",
      args: ["-C", "/repo", "commit", "-m", "Snapshot skill changes"],
    },
    {
      command: "git",
      args: ["-C", "/repo", "rev-parse", "HEAD"],
    },
  ]);
  assert.deepEqual(result, {
    ok: true,
    commitHash: "abc123",
  });
});

test("LocalGitVersionControlPort maps empty commit failure to typed diagnostic", async () => {
  const port = new LocalGitVersionControlPort({
    async commandRunner(command) {
      if (command.args.includes("commit")) {
        const error = new Error("empty commit");
        error.stderr = "nothing to commit, working tree clean";
        throw error;
      }

      return { ok: true, stdout: "" };
    },
  });

  const result = await port.createSnapshot({
    repositoryPath: "/repo",
    message: "Snapshot skill changes",
    paths: ["skills/alpha"],
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "repository-snapshot-empty",
      severity: "warning",
      category: "version-control",
      message: "Repository snapshot has no staged changes to commit.",
    },
  });
});

test("LocalGitVersionControlPort maps snapshot in non-git repository to typed diagnostic", async () => {
  const port = new LocalGitVersionControlPort({
    async commandRunner() {
      const error = new Error("not a repository");
      error.stderr = "fatal: not a git repository";
      throw error;
    },
  });

  const result = await port.createSnapshot({
    repositoryPath: "/repo",
    message: "Snapshot skill changes",
    paths: ["skills/alpha"],
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "not-git-repository",
      severity: "warning",
      category: "version-control",
      message: "Main Repository is not a Git repository.",
    },
  });
});
