import {
  access,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { normalizePath } from "../../domain/index.js";

const APPLIED_METADATA_FILE = ".sponzey-applied.json";
const BACKUP_METADATA_FILE = ".sponzey-backup.json";

export class FileSystemTargetStore {
  constructor({ fileSystem = {} } = {}) {
    this.scanFileSystem = {
      access: fileSystem.access ?? access,
      lstat: fileSystem.lstat ?? lstat,
      readFile: fileSystem.readFile ?? readFile,
      readdir: fileSystem.readdir ?? readdir,
      realpath: fileSystem.realpath ?? realpath,
    };
  }

  async linkSkillToTarget({ sourcePath, targetRootPath, skillName }) {
    const destinationResult = resolveTargetDestination({
      targetRootPath,
      skillName,
    });

    if (!destinationResult.ok) {
      return destinationResult;
    }

    const targetPath = destinationResult.targetPath;
    if (await canAccess(targetPath)) {
      return {
        ok: false,
        error: {
          code: "target-overwrite-rejected",
          severity: "error",
          message: "Target destination already exists.",
        },
      };
    }

    return withFileSystemResult(async () => {
      await mkdir(targetRootPath, { recursive: true });
      await symlink(sourcePath, targetPath, "dir");

      return {
        ok: true,
        targetPath: normalizePath(targetPath),
        linkTargetPath: normalizePath(sourcePath),
      };
    }, "link-skill-to-target");
  }

  async copySkillToTarget({ sourcePath, targetRootPath, skillName, metadata }) {
    const destinationResult = resolveTargetDestination({
      targetRootPath,
      skillName,
    });

    if (!destinationResult.ok) {
      return destinationResult;
    }

    const targetPath = destinationResult.targetPath;
    if (await canAccess(targetPath)) {
      return {
        ok: false,
        error: {
          code: "target-overwrite-rejected",
          severity: "error",
          message: "Target destination already exists.",
        },
      };
    }

    return withFileSystemResult(async () => {
      await mkdir(targetRootPath, { recursive: true });
      await cp(sourcePath, targetPath, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });

      const metadataPath = path.join(targetPath, APPLIED_METADATA_FILE);
      await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

      return {
        ok: true,
        targetPath: normalizePath(targetPath),
        metadataPath: normalizePath(metadataPath),
      };
    }, "copy-skill-to-target");
  }

  async restoreBackupToTarget({
    backupPath,
    targetRootPath,
    skillName,
    overwrite,
    metadata,
  }) {
    const destinationResult = resolveTargetDestination({
      targetRootPath,
      skillName,
    });

    if (!destinationResult.ok) {
      return destinationResult;
    }

    const targetPath = destinationResult.targetPath;
    const targetExists = await canAccess(targetPath);
    if (targetExists && overwrite !== true) {
      return {
        ok: false,
        error: {
          code: "target-overwrite-rejected",
          severity: "error",
          message: "Target destination already exists.",
        },
      };
    }

    return withFileSystemResult(async () => {
      await mkdir(targetRootPath, { recursive: true });
      if (targetExists) {
        await rm(targetPath, { recursive: true, force: false });
      }

      await cp(backupPath, targetPath, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      await rm(path.join(targetPath, BACKUP_METADATA_FILE), {
        force: true,
      });

      const metadataPath = path.join(targetPath, APPLIED_METADATA_FILE);
      await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

      return {
        ok: true,
        targetPath: normalizePath(targetPath),
        metadataPath: normalizePath(metadataPath),
      };
    }, "restore-backup-to-target");
  }

  async removeTargetEntry({ targetPath }) {
    return withFileSystemResult(async () => {
      const stats = await lstat(targetPath);
      const normalizedTargetPath = normalizePath(targetPath);

      if (stats.isSymbolicLink()) {
        await unlink(targetPath);

        return {
          ok: true,
          removedPath: normalizedTargetPath,
          removedKind: "symlink",
        };
      }

      if (stats.isDirectory()) {
        await rm(targetPath, { recursive: true, force: false });

        return {
          ok: true,
          removedPath: normalizedTargetPath,
          removedKind: "directory",
        };
      }

      await unlink(targetPath);

      return {
        ok: true,
        removedPath: normalizedTargetPath,
        removedKind: "file",
      };
    }, "remove-target-entry");
  }

  async replaceCopyFromSource({ sourcePath, targetPath, metadata }) {
    return withFileSystemResult(async () => {
      await rm(targetPath, { recursive: true, force: false });
      await cp(sourcePath, targetPath, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      const metadataPath = path.join(targetPath, APPLIED_METADATA_FILE);
      await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
      return {
        ok: true,
        targetPath: normalizePath(targetPath),
        metadataPath: normalizePath(metadataPath),
      };
    }, "replace-copy-from-source");
  }

  async convertSymlinkToCopy({ sourcePath, targetPath, metadata }) {
    return withFileSystemResult(async () => {
      await unlink(targetPath);
      await cp(sourcePath, targetPath, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      const metadataPath = path.join(targetPath, APPLIED_METADATA_FILE);
      await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
      return {
        ok: true,
        targetPath: normalizePath(targetPath),
        metadataPath: normalizePath(metadataPath),
      };
    }, "convert-symlink-to-copy");
  }

  async convertCopyToSymlink({ sourcePath, targetPath }) {
    return withFileSystemResult(async () => {
      await rm(targetPath, { recursive: true, force: false });
      await symlink(sourcePath, targetPath, "dir");
      return {
        ok: true,
        targetPath: normalizePath(targetPath),
        linkTargetPath: normalizePath(sourcePath),
      };
    }, "convert-copy-to-symlink");
  }

  async scanAppliedSkills({ targetPath, knownSourcePaths = [] }) {
    return withFileSystemResult(async () => {
      const knownSourceSet = await createKnownSourceSet(
        knownSourcePaths,
        this.scanFileSystem,
      );
      const entries = await readOptionalDirectoryEntries(
        targetPath,
        this.scanFileSystem,
      );
      entries.sort((left, right) => left.name.localeCompare(right.name));

      const appliedSkills = [];
      const diagnostics = [];

      for (const entry of entries) {
        const entryPath = path.join(targetPath, entry.name);
        let stats;
        try {
          stats = await this.scanFileSystem.lstat(entryPath);
        } catch (error) {
          diagnostics.push({
            code: "target-entry-unreadable",
            severity: "warning",
            riskLevel: "low",
            message: "A target entry could not be inspected.",
            skillName: entry.name,
            cause: error?.code,
          });
          continue;
        }

        if (stats.isSymbolicLink()) {
          const skill = await classifySymlink({
            name: entry.name,
            entryPath,
            knownSourceSet,
            diagnostics,
            fileSystem: this.scanFileSystem,
          });
          if (skill) {
            appliedSkills.push(skill);
          }
          continue;
        }

        if (!stats.isDirectory()) {
          continue;
        }

        const hasSkillMd = await canAccess(
          path.join(entryPath, "SKILL.md"),
          this.scanFileSystem,
        );
        if (!hasSkillMd) {
          continue;
        }

        appliedSkills.push(
          await classifyDirectory({
            name: entry.name,
            entryPath,
            diagnostics,
            fileSystem: this.scanFileSystem,
          }),
        );
      }

      return {
        ok: true,
        appliedSkills,
        diagnostics,
      };
    }, "scan-applied-skills");
  }
}

function resolveTargetDestination({ targetRootPath, skillName }) {
  const normalizedSkillName = String(skillName ?? "").trim();

  if (
    normalizedSkillName.length === 0 ||
    path.isAbsolute(normalizedSkillName)
  ) {
    return targetPathTraversalRejected();
  }

  const resolvedRootPath = path.resolve(targetRootPath);
  const resolvedTargetPath = path.resolve(resolvedRootPath, normalizedSkillName);

  if (
    resolvedTargetPath === resolvedRootPath ||
    !resolvedTargetPath.startsWith(`${resolvedRootPath}${path.sep}`)
  ) {
    return targetPathTraversalRejected();
  }

  return {
    ok: true,
    targetPath: resolvedTargetPath,
  };
}

function targetPathTraversalRejected() {
  return {
    ok: false,
    error: {
      code: "target-path-traversal-rejected",
      severity: "error",
      message: "Target skill name must stay inside the target root.",
    },
  };
}

async function createKnownSourceSet(knownSourcePaths, fileSystem) {
  const knownSourceSet = new Set();

  for (const sourcePath of knownSourcePaths) {
    try {
      knownSourceSet.add(normalizePath(await fileSystem.realpath(sourcePath)));
    } catch {
      knownSourceSet.add(normalizePath(sourcePath));
    }
  }

  return knownSourceSet;
}

async function classifySymlink({
  name,
  entryPath,
  knownSourceSet,
  diagnostics,
  fileSystem,
}) {
  let resolvedPath;

  try {
    resolvedPath = normalizePath(await fileSystem.realpath(entryPath));
  } catch {
    diagnostics.push({
      code: "broken-symlink",
      severity: "warning",
      riskLevel: "low",
      message: "Target skill symlink cannot be resolved.",
      skillName: name,
    });

    return {
      name,
      kind: "broken-symlink",
      targetPath: normalizePath(entryPath),
    };
  }

  if (!(await canAccess(path.join(resolvedPath, "SKILL.md"), fileSystem))) {
    diagnostics.push({
      code: "symlink-skill-file-missing",
      severity: "warning",
      riskLevel: "low",
      message: "Resolved target symlink does not contain SKILL.md.",
      skillName: name,
    });
    return null;
  }

  if (knownSourceSet.has(resolvedPath)) {
    return {
      name,
      kind: "managed-symlink",
      targetPath: normalizePath(entryPath),
      sourcePath: resolvedPath,
    };
  }

  return {
    name,
    kind: "external-symlink",
    targetPath: normalizePath(entryPath),
    sourcePath: resolvedPath,
  };
}

async function classifyDirectory({
  name,
  entryPath,
  diagnostics,
  fileSystem,
}) {
  const metadataResult = await readAppliedMetadata({
    name,
    entryPath,
    diagnostics,
    fileSystem,
  });

  if (metadataResult.invalid) {
    return {
      name,
      kind: "invalid-managed-copy",
      targetPath: normalizePath(entryPath),
    };
  }

  if (metadataResult.exists) {
    return {
      name,
      kind: "managed-copy",
      targetPath: normalizePath(entryPath),
      metadata: metadataResult.metadata,
    };
  }

  return {
    name,
    kind: "external",
    targetPath: normalizePath(entryPath),
  };
}

async function readAppliedMetadata({
  name,
  entryPath,
  diagnostics,
  fileSystem,
}) {
  try {
    const text = await fileSystem.readFile(
      path.join(entryPath, APPLIED_METADATA_FILE),
      "utf8",
    );
    return {
      exists: true,
      metadata: JSON.parse(text),
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        exists: false,
      };
    }

    diagnostics.push({
      code: "invalid-applied-metadata",
      severity: "warning",
      riskLevel: "low",
      message: "Applied skill metadata must be valid JSON.",
      skillName: name,
    });

    return {
      invalid: true,
    };
  }
}

async function canAccess(filePath, fileSystem = { access }) {
  try {
    await fileSystem.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readOptionalDirectoryEntries(directoryPath, fileSystem) {
  try {
    return await fileSystem.readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function withFileSystemResult(operation, operationName) {
  try {
    return await operation();
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "filesystem-operation-failed",
        severity: "error",
        operation: operationName,
        message: `Filesystem operation failed during ${operationName}.`,
        cause: error?.code,
      },
    };
  }
}
