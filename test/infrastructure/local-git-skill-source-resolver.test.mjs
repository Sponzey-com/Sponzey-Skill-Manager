import test from "node:test";
import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { LocalGitSkillSourceResolver } from "../../src/infrastructure/filesystem/local-git-skill-source-resolver.js";

test("LocalGitSkillSourceResolver resolves a local skill path without downloading", async () => {
  const sourcePath = await createTempPath("ssm-local-source-");
  await writeFile(path.join(sourcePath, "SKILL.md"), "local skill");
  const commands = [];
  const resolver = new LocalGitSkillSourceResolver({
    async commandRunner(command) {
      commands.push(command);
    },
  });

  const result = await resolver.resolveInstallSource({ reference: sourcePath });

  assert.equal(result.ok, true);
  assert.equal(result.sourcePath, path.resolve(sourcePath));
  assert.deepEqual(result.origin, {
    type: "local-path",
    path: path.resolve(sourcePath),
  });
  assert.equal(typeof result.cleanup, "function");
  await result.cleanup();
  assert.deepEqual(commands, []);
});

test("LocalGitSkillSourceResolver clones a GitHub repository URL into a temporary source", async () => {
  const tempRoot = await createTempPath("ssm-github-source-");
  const commands = [];
  const resolver = new LocalGitSkillSourceResolver({
    async tempDirectoryFactory() {
      return tempRoot;
    },
    async commandRunner(command) {
      commands.push(command);
      await mkdir(command.args.at(-1), { recursive: true });
      await writeFile(path.join(command.args.at(-1), "SKILL.md"), "github skill");
    },
  });

  const result = await resolver.resolveInstallSource({
    reference: "https://github.com/acme/review-skill",
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourcePath, path.join(tempRoot, "repo"));
  assert.deepEqual(result.origin, {
    type: "github",
    url: "https://github.com/acme/review-skill",
    cloneUrl: "https://github.com/acme/review-skill.git",
  });
  assert.deepEqual(commands, [
    {
      command: "git",
      args: [
        "clone",
        "--depth",
        "1",
        "https://github.com/acme/review-skill.git",
        path.join(tempRoot, "repo"),
      ],
    },
  ]);

  await result.cleanup();
  await assertRejectsAccess(tempRoot);
});

test("LocalGitSkillSourceResolver supports GitHub tree URLs with branch and subpath", async () => {
  const tempRoot = await createTempPath("ssm-github-tree-source-");
  const commands = [];
  const resolver = new LocalGitSkillSourceResolver({
    async tempDirectoryFactory() {
      return tempRoot;
    },
    async commandRunner(command) {
      commands.push(command);
      const clonePath = command.args.at(-1);
      await mkdir(path.join(clonePath, "skills", "review"), { recursive: true });
      await writeFile(
        path.join(clonePath, "skills", "review", "SKILL.md"),
        "github tree skill",
      );
    },
  });

  const result = await resolver.resolveInstallSource({
    reference: "https://github.com/acme/skills/tree/main/skills/review",
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourcePath, path.join(tempRoot, "repo", "skills", "review"));
  assert.deepEqual(result.origin, {
    type: "github",
    url: "https://github.com/acme/skills/tree/main/skills/review",
    cloneUrl: "https://github.com/acme/skills.git",
    ref: "main",
    subPath: "skills/review",
  });
  assert.deepEqual(commands, [
    {
      command: "git",
      args: [
        "clone",
        "--depth",
        "1",
        "--branch",
        "main",
        "https://github.com/acme/skills.git",
        path.join(tempRoot, "repo"),
      ],
    },
  ]);

  await result.cleanup();
});

test("LocalGitSkillSourceResolver discovers every skill below the selected GitHub folder", async () => {
  const tempRoot = await createTempPath("ssm-github-folder-source-");
  const resolver = new LocalGitSkillSourceResolver({
    async tempDirectoryFactory() {
      return tempRoot;
    },
    async commandRunner(command) {
      const clonePath = command.args.at(-1);
      await mkdir(path.join(clonePath, "catalog", "review"), { recursive: true });
      await mkdir(path.join(clonePath, "catalog", "nested", "testing"), {
        recursive: true,
      });
      await mkdir(path.join(clonePath, "outside"), { recursive: true });
      await writeFile(
        path.join(clonePath, "catalog", "review", "SKILL.md"),
        "review skill",
      );
      await writeFile(
        path.join(clonePath, "catalog", "nested", "testing", "SKILL.md"),
        "testing skill",
      );
      await writeFile(
        path.join(clonePath, "outside", "SKILL.md"),
        "outside skill",
      );
    },
  });

  const result = await resolver.resolveInstallSources({
    reference: "https://github.com/acme/skills/tree/main/catalog",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.sources.map((source) => ({
      name: source.name,
      sourcePath: source.sourcePath,
      origin: source.origin,
    })),
    [
      {
        name: "testing",
        sourcePath: path.join(tempRoot, "repo", "catalog", "nested", "testing"),
        origin: {
          type: "github",
          url: "https://github.com/acme/skills/tree/main/catalog",
          cloneUrl: "https://github.com/acme/skills.git",
          ref: "main",
          subPath: "catalog/nested/testing",
        },
      },
      {
        name: "review",
        sourcePath: path.join(tempRoot, "repo", "catalog", "review"),
        origin: {
          type: "github",
          url: "https://github.com/acme/skills/tree/main/catalog",
          cloneUrl: "https://github.com/acme/skills.git",
          ref: "main",
          subPath: "catalog/review",
        },
      },
    ],
  );

  await result.cleanup();
  await assertRejectsAccess(tempRoot);
});

test("LocalGitSkillSourceResolver rejects sources without SKILL.md", async () => {
  const sourcePath = await createTempPath("ssm-invalid-source-");
  const resolver = new LocalGitSkillSourceResolver();

  const result = await resolver.resolveInstallSource({ reference: sourcePath });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "install-source-skill-md-missing",
      severity: "error",
      message: "Install source must contain SKILL.md at its root.",
    },
  });
});

async function createTempPath(prefix) {
  return mkdtemp(path.join(tmpdir(), prefix));
}

async function assertRejectsAccess(filePath) {
  await assert.rejects(async () => access(filePath));
}
