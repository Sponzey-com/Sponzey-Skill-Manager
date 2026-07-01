import test from "node:test";
import assert from "node:assert/strict";

import { runReleaseGate } from "../../scripts/release-gate.mjs";

const validSmokeChecklist = [
  "# Phase 004 Release Smoke Checklist",
  "## 1. Automated Verification",
  "## 2. Extension Development Host",
  "## 3. Repository Setup",
  "## 4. Repository Index And Versioning",
  "## 5. Main Repository Skill Lifecycle",
  "## 6. Global And Project Apply",
  "## 7. Diagnostics And Analysis",
  "## 8. Backup Transfer And Safety",
  "## 9. Diagnostics Remediation Workflow",
  "## 10. Watcher Refresh And Runtime Recomposition",
  "## 11. Documentation And Release Gate",
].join("\n");

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
    async readTextFile(filePath) {
      assert.equal(filePath, ".tasks/release-smoke.md");
      return validSmokeChecklist;
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
    async readTextFile() {
      return validSmokeChecklist;
    },
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "ManifestFailed",
    failedCheck: "manifest",
  });
});

test("release gate rejects invalid smoke checklist content", async () => {
  const result = await runReleaseGate({
    async runCommand() {
      return { ok: true };
    },
    async checkFile() {},
    async readTextFile() {
      return "# Wrong Checklist\n\n## 1. Automated Verification\n";
    },
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "SmokeMissing",
    failedCheck: "smoke",
  });
});
