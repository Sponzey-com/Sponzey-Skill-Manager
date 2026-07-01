import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { FileSystemBackupComparisonPort } from "../../src/infrastructure/index.js";

test("FileSystemBackupComparisonPort summarizes backup and reference differences", async () => {
  const rootPath = await createTempPath("ssm-backup-compare-");
  const backupPath = path.join(rootPath, "backup");
  const referencePath = path.join(rootPath, "reference");
  await writeSkillFile(backupPath, "SKILL.md", "old body");
  await writeSkillFile(backupPath, "notes.md", "backup only");
  await writeSkillFile(backupPath, "references/shared.md", "same");
  await writeSkillFile(backupPath, ".sponzey-backup.json", "{\"metadata\":true}");
  await writeSkillFile(referencePath, "SKILL.md", "new body");
  await writeSkillFile(referencePath, "references/new.md", "reference only");
  await writeSkillFile(referencePath, "references/shared.md", "same");
  await writeSkillFile(referencePath, ".sponzey-source.json", "{\"metadata\":true}");
  const port = new FileSystemBackupComparisonPort();

  const result = await port.compareDirectories({ backupPath, referencePath });

  assert.equal(result.ok, true);
  assert.equal(result.comparison.status, "different");
  assert.deepEqual(result.comparison.backupOnlyFiles, ["notes.md"]);
  assert.deepEqual(result.comparison.referenceOnlyFiles, ["references/new.md"]);
  assert.deepEqual(result.comparison.modifiedFiles, ["SKILL.md"]);
  assert.equal(result.comparison.unchangedFileCount, 1);
  assert.equal(result.comparison.backupOnlyFileCount, 1);
  assert.equal(result.comparison.referenceOnlyFileCount, 1);
  assert.equal(result.comparison.modifiedFileCount, 1);
  assert.equal(result.comparison.comparedFileCount, 4);
  assert.equal(result.comparison.backupPath.endsWith("/backup"), true);
  assert.equal(result.comparison.referencePath.endsWith("/reference"), true);
});

test("FileSystemBackupComparisonPort returns identical summary for matching content", async () => {
  const rootPath = await createTempPath("ssm-backup-compare-identical-");
  const backupPath = path.join(rootPath, "backup");
  const referencePath = path.join(rootPath, "reference");
  await writeSkillFile(backupPath, "SKILL.md", "same body");
  await writeSkillFile(backupPath, "references/shared.md", "same");
  await writeSkillFile(referencePath, "SKILL.md", "same body");
  await writeSkillFile(referencePath, "references/shared.md", "same");
  const port = new FileSystemBackupComparisonPort();

  const result = await port.compareDirectories({ backupPath, referencePath });

  assert.equal(result.ok, true);
  assert.deepEqual(result.comparison, {
    status: "identical",
    backupPath: normalizeForAssert(backupPath),
    referencePath: normalizeForAssert(referencePath),
    backupOnlyFiles: [],
    referenceOnlyFiles: [],
    modifiedFiles: [],
    unchangedFileCount: 2,
    backupOnlyFileCount: 0,
    referenceOnlyFileCount: 0,
    modifiedFileCount: 0,
    comparedFileCount: 2,
  });
});

test("FileSystemBackupComparisonPort returns typed diagnostic for missing path", async () => {
  const rootPath = await createTempPath("ssm-backup-compare-missing-");
  const backupPath = path.join(rootPath, "missing-backup");
  const referencePath = path.join(rootPath, "reference");
  await writeSkillFile(referencePath, "SKILL.md", "same body");
  const port = new FileSystemBackupComparisonPort();

  const result = await port.compareDirectories({ backupPath, referencePath });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "backup-comparison-path-not-found",
      severity: "error",
      message: "Backup comparison path does not exist.",
    },
  });
});

test("FileSystemBackupComparisonPort compares bytes and never mutates source files", async () => {
  const rootPath = await createTempPath("ssm-backup-compare-immutable-");
  const backupPath = path.join(rootPath, "backup");
  const referencePath = path.join(rootPath, "reference");
  await writeSkillFile(backupPath, "SKILL.md", "backup body");
  await writeSkillFile(referencePath, "SKILL.md", "reference body");
  const port = new FileSystemBackupComparisonPort();

  const result = await port.compareDirectories({ backupPath, referencePath });

  assert.equal(result.ok, true);
  assert.equal(result.comparison.modifiedFileCount, 1);
  assert.equal(await readFile(path.join(backupPath, "SKILL.md"), "utf8"), "backup body");
  assert.equal(
    await readFile(path.join(referencePath, "SKILL.md"), "utf8"),
    "reference body",
  );
});

async function writeSkillFile(rootPath, relativePath, content) {
  const filePath = path.join(rootPath, ...relativePath.split("/"));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

function normalizeForAssert(filePath) {
  return filePath.split(path.sep).join("/");
}

function createTempPath(prefix) {
  return mkdtemp(path.join(tmpdir(), prefix));
}
