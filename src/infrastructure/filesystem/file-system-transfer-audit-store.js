import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizePath } from "../../domain/index.js";
import { maskEvent } from "../logging/event-logger.js";

const AUDIT_PATH_PARTS = [".sponzey", "transfer-log.json"];

export class FileSystemTransferAuditStore {
  async appendRecord({ repositoryPath, record }) {
    try {
      const auditPath = auditLogPath(repositoryPath);
      const existing = await readAuditFile(auditPath);
      const nextRecord = {
        schemaVersion: 1,
        ...maskEvent(record),
      };
      const records = [...existing.records, nextRecord];
      await mkdir(path.dirname(auditPath), { recursive: true });
      await writeFile(
        auditPath,
        `${JSON.stringify({ schemaVersion: 1, records }, null, 2)}\n`,
      );
      return {
        ok: true,
        auditPath: normalizePath(auditPath),
        record: nextRecord,
      };
    } catch {
      return {
        ok: false,
        error: {
          code: "transfer-audit-write-failed",
          severity: "warning",
          message: "Transfer audit record could not be written.",
        },
      };
    }
  }

  async readRecords({ repositoryPath }) {
    try {
      const auditPath = auditLogPath(repositoryPath);
      const result = await readAuditFile(auditPath);
      return {
        ok: true,
        auditPath: normalizePath(auditPath),
        records: result.records,
      };
    } catch {
      return {
        ok: false,
        error: {
          code: "transfer-audit-read-failed",
          severity: "warning",
          message: "Transfer audit records could not be read.",
        },
      };
    }
  }
}

async function readAuditFile(auditPath) {
  try {
    const text = await readFile(auditPath, "utf8");
    const parsed = JSON.parse(text);
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { records: [] };
    }
    throw error;
  }
}

function auditLogPath(repositoryPath) {
  return path.join(repositoryPath, ...AUDIT_PATH_PARTS);
}
