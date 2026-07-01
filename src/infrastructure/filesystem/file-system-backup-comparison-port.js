import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { normalizePath } from "../../domain/index.js";

const DEFAULT_IGNORED_FILE_NAMES = new Set([
  ".sponzey-applied.json",
  ".sponzey-source.json",
  ".sponzey-backup.json",
]);

export class FileSystemBackupComparisonPort {
  async compareDirectories({
    backupPath,
    referencePath,
    ignoredFileNames = DEFAULT_IGNORED_FILE_NAMES,
  }) {
    try {
      const backupFiles = await collectComparableFiles({
        rootPath: backupPath,
        currentPath: backupPath,
        ignoredFileNames,
      });
      const referenceFiles = await collectComparableFiles({
        rootPath: referencePath,
        currentPath: referencePath,
        ignoredFileNames,
      });
      const comparison = compareFileMaps({
        backupFiles,
        referenceFiles,
        backupPath,
        referencePath,
      });

      return {
        ok: true,
        comparison,
      };
    } catch (error) {
      if (["ENOENT", "ENOTDIR"].includes(error?.code)) {
        return {
          ok: false,
          error: {
            code: "backup-comparison-path-not-found",
            severity: "error",
            message: "Backup comparison path does not exist.",
          },
        };
      }

      return {
        ok: false,
        error: {
          code: "backup-comparison-read-failed",
          severity: "error",
          message: "Backup comparison could not read the requested paths.",
        },
      };
    }
  }
}

async function collectComparableFiles({ rootPath, currentPath, ignoredFileNames }) {
  const entries = await readdir(currentPath, { withFileTypes: true });
  const sortedEntries = [...entries].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const files = new Map();

  for (const entry of sortedEntries) {
    const entryPath = path.join(currentPath, entry.name);
    const stats = await lstat(entryPath);

    if (stats.isSymbolicLink()) {
      continue;
    }

    if (stats.isDirectory()) {
      const nestedFiles = await collectComparableFiles({
        rootPath,
        currentPath: entryPath,
        ignoredFileNames,
      });
      for (const [relativePath, hash] of nestedFiles) {
        files.set(relativePath, hash);
      }
      continue;
    }

    if (stats.isFile() && !ignoredFileNames.has(entry.name)) {
      const relativePath = normalizePath(path.relative(rootPath, entryPath));
      files.set(relativePath, hashBuffer(await readFile(entryPath)));
    }
  }

  return files;
}

function compareFileMaps({ backupFiles, referenceFiles, backupPath, referencePath }) {
  const allRelativePaths = [
    ...new Set([...backupFiles.keys(), ...referenceFiles.keys()]),
  ].sort((left, right) => left.localeCompare(right));
  const backupOnlyFiles = [];
  const referenceOnlyFiles = [];
  const modifiedFiles = [];
  let unchangedFileCount = 0;

  for (const relativePath of allRelativePaths) {
    const backupHash = backupFiles.get(relativePath);
    const referenceHash = referenceFiles.get(relativePath);

    if (backupHash === undefined) {
      referenceOnlyFiles.push(relativePath);
      continue;
    }

    if (referenceHash === undefined) {
      backupOnlyFiles.push(relativePath);
      continue;
    }

    if (backupHash !== referenceHash) {
      modifiedFiles.push(relativePath);
      continue;
    }

    unchangedFileCount += 1;
  }

  const status =
    backupOnlyFiles.length === 0 &&
    referenceOnlyFiles.length === 0 &&
    modifiedFiles.length === 0
      ? "identical"
      : "different";

  return {
    status,
    backupPath: normalizePath(backupPath),
    referencePath: normalizePath(referencePath),
    backupOnlyFiles,
    referenceOnlyFiles,
    modifiedFiles,
    unchangedFileCount,
    backupOnlyFileCount: backupOnlyFiles.length,
    referenceOnlyFileCount: referenceOnlyFiles.length,
    modifiedFileCount: modifiedFiles.length,
    comparedFileCount: allRelativePaths.length,
  };
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
