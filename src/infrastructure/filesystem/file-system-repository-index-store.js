import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  normalizePath,
  REPOSITORY_INDEX_SCHEMA_VERSION,
  repositoryIndexUnsupportedVersionDiagnostic,
} from "../../domain/index.js";

export class FileSystemRepositoryIndexStore {
  async writeRepositoryIndex({ repositoryPath, index }) {
    const validation = validateRepositoryIndex(index);
    if (!validation.ok) {
      return validation;
    }

    try {
      const metadataPath = repositoryIndexPath(repositoryPath);
      await mkdir(path.dirname(metadataPath), { recursive: true });
      await writeFile(metadataPath, `${JSON.stringify(index, null, 2)}\n`);

      return {
        ok: true,
        metadataPath: normalizePath(metadataPath),
      };
    } catch {
      return repositoryIndexWriteFailed();
    }
  }

  async readRepositoryIndex({ repositoryPath }) {
    const metadataPath = repositoryIndexPath(repositoryPath);

    try {
      const index = JSON.parse(await readFile(metadataPath, "utf8"));
      const validation = validateRepositoryIndex(index);
      if (!validation.ok) {
        return validation;
      }

      return {
        ok: true,
        index,
        metadataPath: normalizePath(metadataPath),
      };
    } catch (error) {
      if (error?.code === "ENOENT") {
        return {
          ok: true,
          index: null,
          metadataPath: normalizePath(metadataPath),
        };
      }

      if (error instanceof SyntaxError) {
        return repositoryIndexInvalidJson();
      }

      return repositoryIndexReadFailed();
    }
  }
}

function repositoryIndexPath(repositoryPath) {
  return path.join(repositoryPath, ".sponzey", "index.json");
}

function validateRepositoryIndex(index) {
  if (
    index?.schemaVersion !== undefined &&
    index.schemaVersion !== REPOSITORY_INDEX_SCHEMA_VERSION
  ) {
    return {
      ok: false,
      error: repositoryIndexUnsupportedVersionDiagnostic(),
    };
  }

  const requiredFieldsPresent =
    index?.schemaVersion === REPOSITORY_INDEX_SCHEMA_VERSION &&
    hasText(index?.indexedAt) &&
    Array.isArray(index?.sources) &&
    index.sources.every(isValidSourceIndexEntry);

  if (!requiredFieldsPresent) {
    return {
      ok: false,
      error: {
        code: "repository-index-invalid",
        severity: "error",
        category: "repository",
        message: "Repository index metadata is missing required fields.",
      },
    };
  }

  return { ok: true };
}

function isValidSourceIndexEntry(entry) {
  return (
    hasText(entry?.sourceId) &&
    hasText(entry?.sourceName) &&
    hasText(entry?.sourcePath) &&
    hasText(entry?.indexedAt) &&
    hasText(entry?.indexStatus)
  );
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function repositoryIndexWriteFailed() {
  return {
    ok: false,
    error: {
      code: "repository-index-write-failed",
      severity: "error",
      category: "repository",
      message: "Repository index metadata could not be written.",
    },
  };
}

function repositoryIndexReadFailed() {
  return {
    ok: false,
    error: {
      code: "repository-index-read-failed",
      severity: "error",
      category: "repository",
      message: "Repository index metadata could not be read.",
    },
  };
}

function repositoryIndexInvalidJson() {
  return {
    ok: false,
    error: {
      code: "repository-index-invalid-json",
      severity: "error",
      category: "repository",
      message: "Repository index metadata is not valid JSON.",
    },
  };
}
