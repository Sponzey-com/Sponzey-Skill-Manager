import test from "node:test";
import assert from "node:assert/strict";

import { runReleaseGate } from "../../scripts/release-gate.mjs";

test("release gate runs required checks and verifies smoke checklist", async () => {
  const checks = [];
  const result = await runReleaseGate({
    async runCommand(check) {
      checks.push(check.name);
      return { ok: true };
    },
    async checkFile(filePath) {
      assert.equal(filePath, ".tasks/release-smoke.md");
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(checks, ["tests", "architecture", "manifest", "build"]);
});

test("release gate returns machine-readable failure code", async () => {
  const result = await runReleaseGate({
    async runCommand(check) {
      return { ok: check.name !== "manifest" };
    },
    async checkFile() {},
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "ManifestFailed",
    failedCheck: "manifest",
  });
});
