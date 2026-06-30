import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { FileSystemTransferAuditStore } from "../../src/infrastructure/index.js";

test("FileSystemTransferAuditStore appends masked transfer records", async () => {
  const repositoryPath = await mkdtemp(path.join(os.tmpdir(), "ssm-audit-"));
  const store = new FileSystemTransferAuditStore();

  const appendResult = await store.appendRecord({
    repositoryPath,
    record: {
      operationType: "copy",
      sourcePath: `${process.env.HOME}/secret-source`,
      token: "abc-token",
      status: "completed",
    },
  });
  const readResult = await store.readRecords({ repositoryPath });

  assert.equal(appendResult.ok, true);
  assert.equal(readResult.ok, true);
  assert.equal(readResult.records.length, 1);
  assert.equal(readResult.records[0].token, "[masked]");
  assert.equal(readResult.records[0].sourcePath.includes(process.env.HOME ?? "never"), false);
});
