import test from "node:test";
import assert from "node:assert/strict";

import { runReleaseGate } from "../../scripts/release-gate.mjs";

const validSmokeChecklist = [
  "# Phase 004 릴리스 스모크 체크리스트",
  "## 1. 자동 검증",
  "## 2. 확장 개발 호스트",
  "## 3. 리포지토리 설정",
  "## 4. 리포지토리 인덱스와 버전 관리",
  "## 5. Main Repository 스킬 생명주기",
  "## 6. Global 및 Project 적용",
  "## 7. Diagnostics와 Analysis",
  "## 8. 백업 전송과 안전성",
  "## 9. Diagnostics Remediation Workflow",
  "## 10. Watcher Refresh와 Runtime Recomposition",
  "## 11. 문서와 Release Gate",
].join("\n");

const validSmokeEvidence = [
  "# Phase 004 확장 호스트 수동 검증 기록",
  "## 1. 검증 세션",
  "## 2. 환경",
  "## 3. 실행 명령",
  "## 4. 체크리스트 결과 요약",
  "## 5. 실패 또는 차단 항목",
  "## 6. 검증 증거 메모",
  "## 7. 릴리스 판단",
].join("\n");

test("release gate runs required checks and verifies smoke checklist", async () => {
  const checks = [];
  const checkedFiles = [];
  const packagingChecks = [];
  const result = await runReleaseGate({
    async runCommand(check) {
      checks.push(check.name);
      return { ok: true };
    },
    async checkFile(filePath) {
      checkedFiles.push(filePath);
    },
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return validSmokeEvidence;
      }
      return validSmokeChecklist;
    },
    async checkPackagingCapability(input) {
      packagingChecks.push(input);
      return {
        ok: true,
        status: "available",
        code: "PackagingToolAvailable",
        checked: "packaging",
      };
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(checks, ["tests", "architecture", "manifest", "build"]);
  assert.deepEqual(checkedFiles, [
    "docs/release-smoke.md",
    "docs/extension-host-smoke-evidence.md",
  ]);
  assert.deepEqual(packagingChecks, [{ mode: "check" }]);
  assert.deepEqual(result.checked, [
    "tests",
    "architecture",
    "manifest",
    "build",
    "docs",
    "smoke",
    "evidence",
    "packaging",
  ]);
});

test("release gate returns machine-readable failure code", async () => {
  const result = await runReleaseGate({
    async runCommand(check) {
      return { ok: check.name !== "manifest" };
    },
    async checkFile() {},
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return validSmokeEvidence;
      }
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
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return validSmokeEvidence;
      }
      return "# Wrong Checklist\n\n## 1. 자동 검증\n";
    },
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "SmokeMissing",
    failedCheck: "smoke",
  });
});

test("release gate rejects missing smoke evidence template", async () => {
  const result = await runReleaseGate({
    async runCommand() {
      return { ok: true };
    },
    async checkFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        throw new Error("missing evidence");
      }
    },
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return validSmokeEvidence;
      }
      return validSmokeChecklist;
    },
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "DocsFailed",
    failedCheck: "docs",
  });
});

test("release gate rejects invalid smoke evidence template content", async () => {
  const result = await runReleaseGate({
    async runCommand() {
      return { ok: true };
    },
    async checkFile() {},
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return "# Wrong Evidence\n";
      }
      return validSmokeChecklist;
    },
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "SmokeMissing",
    failedCheck: "smoke",
  });
});

test("release gate records skipped local VSIX packaging without failing", async () => {
  const result = await runReleaseGate({
    async runCommand() {
      return { ok: true };
    },
    async checkFile() {},
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return validSmokeEvidence;
      }
      return validSmokeChecklist;
    },
    async checkPackagingCapability() {
      return {
        ok: true,
        status: "skipped",
        code: "PackagingToolMissing",
        checked: "packaging",
        message: "Local VSIX packaging skipped.",
      };
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.checked, [
    "tests",
    "architecture",
    "manifest",
    "build",
    "docs",
    "smoke",
    "evidence",
    "packaging",
  ]);
  assert.deepEqual(result.skipped, [
    {
      check: "packaging",
      code: "PackagingToolMissing",
      message: "Local VSIX packaging skipped.",
    },
  ]);
});

test("release gate fails with machine-readable packaging failure", async () => {
  const result = await runReleaseGate({
    async runCommand() {
      return { ok: true };
    },
    async checkFile() {},
    async readTextFile(filePath) {
      if (filePath === "docs/extension-host-smoke-evidence.md") {
        return validSmokeEvidence;
      }
      return validSmokeChecklist;
    },
    async checkPackagingCapability() {
      return {
        ok: false,
        status: "failed",
        code: "PackageFailed",
        checked: "packaging",
      };
    },
  });

  assert.deepEqual(result, {
    ok: false,
    failureCode: "PackageFailed",
    failedCheck: "packaging",
  });
});
