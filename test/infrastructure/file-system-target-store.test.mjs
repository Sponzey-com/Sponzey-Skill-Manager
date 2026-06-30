import test from "node:test";
import assert from "node:assert/strict";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { FileSystemTargetStore } from "../../src/infrastructure/filesystem/file-system-target-store.js";

test("scanAppliedSkills classifies managed symlink, managed copy, and external skills", async () => {
  const rootPath = await createTempPath("ssm-target-scan-");
  const sourcePath = path.join(rootPath, "main", "skills", "valid");
  const targetPath = path.join(rootPath, "target");
  await mkdir(sourcePath, { recursive: true });
  await mkdir(targetPath, { recursive: true });
  await writeFile(path.join(sourcePath, "SKILL.md"), "source");

  await symlink(sourcePath, path.join(targetPath, "managed-link"));
  await createTargetSkill(path.join(targetPath, "managed-copy"), {
    ".sponzey-applied.json": JSON.stringify({
      sourceSkillId: "valid",
      sourcePath,
      applyMode: "copy",
    }),
  });
  await createTargetSkill(path.join(targetPath, "external"), {});
  await mkdir(path.join(targetPath, "not-skill"), { recursive: true });

  const store = new FileSystemTargetStore();
  const result = await store.scanAppliedSkills({
    targetPath,
    knownSourcePaths: [sourcePath],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(
    result.appliedSkills.map((skill) => [skill.name, skill.kind]),
    [
      ["external", "external"],
      ["managed-copy", "managed-copy"],
      ["managed-link", "managed-symlink"],
    ],
  );
  assert.equal(result.appliedSkills[1].metadata.sourceSkillId, "valid");
  assert.equal(result.appliedSkills[2].sourcePath.endsWith("/main/skills/valid"), true);
});

test("scanAppliedSkills returns empty result when target directory is missing", async () => {
  const rootPath = await createTempPath("ssm-target-missing-");
  const targetPath = path.join(rootPath, "missing-target");
  const store = new FileSystemTargetStore();

  const result = await store.scanAppliedSkills({
    targetPath,
    knownSourcePaths: [],
  });

  assert.deepEqual(result, {
    ok: true,
    appliedSkills: [],
    diagnostics: [],
  });
});

test("scanAppliedSkills returns broken symlink diagnostic without throwing", async () => {
  const rootPath = await createTempPath("ssm-target-broken-");
  const targetPath = path.join(rootPath, "target");
  await mkdir(targetPath, { recursive: true });
  await symlink(path.join(rootPath, "missing-source"), path.join(targetPath, "broken"));

  const store = new FileSystemTargetStore();
  const result = await store.scanAppliedSkills({
    targetPath,
    knownSourcePaths: [],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.appliedSkills, [
    {
      name: "broken",
      kind: "broken-symlink",
      targetPath: normalizeExpectedPath(path.join(targetPath, "broken")),
    },
  ]);
  assert.deepEqual(result.diagnostics, [
    {
      code: "broken-symlink",
      severity: "warning",
      riskLevel: "low",
      message: "Target skill symlink cannot be resolved.",
      skillName: "broken",
    },
  ]);
});

test("scanAppliedSkills returns invalid managed metadata diagnostic", async () => {
  const rootPath = await createTempPath("ssm-target-invalid-metadata-");
  const targetPath = path.join(rootPath, "target");
  await mkdir(targetPath, { recursive: true });
  await createTargetSkill(path.join(targetPath, "invalid-copy"), {
    ".sponzey-applied.json": "{ invalid json",
  });

  const store = new FileSystemTargetStore();
  const result = await store.scanAppliedSkills({
    targetPath,
    knownSourcePaths: [],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.appliedSkills, [
    {
      name: "invalid-copy",
      kind: "invalid-managed-copy",
      targetPath: normalizeExpectedPath(path.join(targetPath, "invalid-copy")),
    },
  ]);
  assert.deepEqual(result.diagnostics, [
    {
      code: "invalid-applied-metadata",
      severity: "warning",
      riskLevel: "low",
      message: "Applied skill metadata must be valid JSON.",
      skillName: "invalid-copy",
    },
  ]);
});

test("copySkillToTarget copies source directory and writes managed metadata", async () => {
  const rootPath = await createTempPath("ssm-target-copy-");
  const sourcePath = path.join(rootPath, "main", "skills", "copy-source");
  const targetRootPath = path.join(rootPath, "target");
  await createSourceSkill(sourcePath, {
    "references/info.md": "reference",
  });
  await mkdir(targetRootPath, { recursive: true });
  const metadata = {
    sourceSkillId: "copy-source",
    sourcePath,
    applyMode: "copy",
  };

  const store = new FileSystemTargetStore();
  const result = await store.copySkillToTarget({
    sourcePath,
    targetRootPath,
    skillName: "copy-source",
    metadata,
  });

  assert.equal(result.ok, true);
  assert.equal(result.targetPath.endsWith("/target/copy-source"), true);
  assert.equal(
    await readFile(path.join(targetRootPath, "copy-source", "SKILL.md"), "utf8"),
    "source",
  );
  assert.equal(
    await readFile(
      path.join(targetRootPath, "copy-source", "references", "info.md"),
      "utf8",
    ),
    "reference",
  );
  assert.deepEqual(
    JSON.parse(
      await readFile(
        path.join(targetRootPath, "copy-source", ".sponzey-applied.json"),
        "utf8",
      ),
    ),
    metadata,
  );
});

test("copySkillToTarget rejects overwrite and path traversal", async () => {
  const rootPath = await createTempPath("ssm-target-copy-reject-");
  const sourcePath = path.join(rootPath, "main", "skills", "source");
  const targetRootPath = path.join(rootPath, "target");
  await createSourceSkill(sourcePath, {});
  await mkdir(path.join(targetRootPath, "existing"), { recursive: true });

  const store = new FileSystemTargetStore();
  const overwriteResult = await store.copySkillToTarget({
    sourcePath,
    targetRootPath,
    skillName: "existing",
    metadata: {},
  });
  const traversalResult = await store.copySkillToTarget({
    sourcePath,
    targetRootPath,
    skillName: "../escape",
    metadata: {},
  });

  assert.deepEqual(overwriteResult, {
    ok: false,
    error: {
      code: "target-overwrite-rejected",
      severity: "error",
      message: "Target destination already exists.",
    },
  });
  assert.deepEqual(traversalResult, {
    ok: false,
    error: {
      code: "target-path-traversal-rejected",
      severity: "error",
      message: "Target skill name must stay inside the target root.",
    },
  });
  assert.equal(await pathExists(path.join(rootPath, "escape")), false);
});

test("linkSkillToTarget creates symlink that scans as managed symlink", async () => {
  const rootPath = await createTempPath("ssm-target-link-");
  const sourcePath = path.join(rootPath, "main", "skills", "source");
  const targetRootPath = path.join(rootPath, "target");
  await createSourceSkill(sourcePath, {});
  await mkdir(targetRootPath, { recursive: true });

  const store = new FileSystemTargetStore();
  const linkResult = await store.linkSkillToTarget({
    sourcePath,
    targetRootPath,
    skillName: "source",
  });
  const scanResult = await store.scanAppliedSkills({
    targetPath: targetRootPath,
    knownSourcePaths: [sourcePath],
  });

  assert.equal(linkResult.ok, true);
  assert.equal(linkResult.targetPath.endsWith("/target/source"), true);
  assert.equal(linkResult.linkTargetPath.endsWith("/main/skills/source"), true);
  assert.equal((await lstat(path.join(targetRootPath, "source"))).isSymbolicLink(), true);
  assert.deepEqual(
    scanResult.appliedSkills.map((skill) => [skill.name, skill.kind]),
    [["source", "managed-symlink"]],
  );
});

test("linkSkillToTarget rejects overwrite and path traversal", async () => {
  const rootPath = await createTempPath("ssm-target-link-reject-");
  const sourcePath = path.join(rootPath, "main", "skills", "source");
  const targetRootPath = path.join(rootPath, "target");
  await createSourceSkill(sourcePath, {});
  await mkdir(path.join(targetRootPath, "existing"), { recursive: true });

  const store = new FileSystemTargetStore();
  const overwriteResult = await store.linkSkillToTarget({
    sourcePath,
    targetRootPath,
    skillName: "existing",
  });
  const traversalResult = await store.linkSkillToTarget({
    sourcePath,
    targetRootPath,
    skillName: "../escape",
  });

  assert.deepEqual(overwriteResult, {
    ok: false,
    error: {
      code: "target-overwrite-rejected",
      severity: "error",
      message: "Target destination already exists.",
    },
  });
  assert.deepEqual(traversalResult, {
    ok: false,
    error: {
      code: "target-path-traversal-rejected",
      severity: "error",
      message: "Target skill name must stay inside the target root.",
    },
  });
});

test("removeTargetEntry removes symlink without deleting source directory", async () => {
  const rootPath = await createTempPath("ssm-target-remove-link-");
  const sourcePath = path.join(rootPath, "main", "skills", "source");
  const linkPath = path.join(rootPath, "target", "source");
  await createSourceSkill(sourcePath, {});
  await mkdir(path.dirname(linkPath), { recursive: true });
  await symlink(sourcePath, linkPath);

  const store = new FileSystemTargetStore();
  const result = await store.removeTargetEntry({ targetPath: linkPath });

  assert.deepEqual(result, {
    ok: true,
    removedPath: normalizeExpectedPath(linkPath),
    removedKind: "symlink",
  });
  assert.equal(await pathExists(linkPath), false);
  assert.equal(await pathExists(path.join(sourcePath, "SKILL.md")), true);
});

test("removeTargetEntry removes target directory without deleting source directory", async () => {
  const rootPath = await createTempPath("ssm-target-remove-directory-");
  const sourcePath = path.join(rootPath, "main", "skills", "source");
  const targetPath = path.join(rootPath, "target", "source");
  await createSourceSkill(sourcePath, {});
  await createTargetSkill(targetPath, {
    ".sponzey-applied.json": JSON.stringify({
      sourceSkillId: "source",
      sourcePath,
      applyMode: "copy",
    }),
  });

  const store = new FileSystemTargetStore();
  const result = await store.removeTargetEntry({ targetPath });

  assert.deepEqual(result, {
    ok: true,
    removedPath: normalizeExpectedPath(targetPath),
    removedKind: "directory",
  });
  assert.equal(await pathExists(targetPath), false);
  assert.equal(await pathExists(path.join(sourcePath, "SKILL.md")), true);
});

async function createTargetSkill(skillPath, extraFiles) {
  await mkdir(skillPath, { recursive: true });
  await writeFile(path.join(skillPath, "SKILL.md"), "target");

  for (const [fileName, content] of Object.entries(extraFiles)) {
    await writeFile(path.join(skillPath, fileName), content);
  }
}

async function createSourceSkill(skillPath, extraFiles) {
  await mkdir(skillPath, { recursive: true });
  await writeFile(path.join(skillPath, "SKILL.md"), "source");

  for (const [fileName, content] of Object.entries(extraFiles)) {
    const filePath = path.join(skillPath, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
  }
}

async function createTempPath(prefix) {
  return mkdtemp(path.join(tmpdir(), prefix));
}

function normalizeExpectedPath(value) {
  return value.replaceAll("\\", "/").replace(/\/+/g, "/");
}

async function pathExists(value) {
  try {
    await stat(value);
    return true;
  } catch {
    return false;
  }
}
