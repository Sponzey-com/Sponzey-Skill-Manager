import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateVsixCandidatePackaging } from "./package-vsix-candidate.mjs";

const CHECKS = Object.freeze([
  {
    name: "tests",
    command: "npm",
    args: ["test"],
    failureCode: "TestsFailed",
  },
  {
    name: "architecture",
    command: "npm",
    args: ["run", "check:architecture"],
    failureCode: "ArchitectureFailed",
  },
  {
    name: "manifest",
    command: "npm",
    args: ["run", "check:manifest"],
    failureCode: "ManifestFailed",
  },
  {
    name: "build",
    command: "npm",
    args: ["run", "build"],
    failureCode: "PackageFailed",
  },
]);
const SMOKE_CHECKLIST_PATH = "docs/release-smoke.md";
const SMOKE_EVIDENCE_PATH = "docs/extension-host-smoke-evidence.md";
const REQUIRED_SMOKE_MARKERS = Object.freeze([
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
]);
const REQUIRED_EVIDENCE_MARKERS = Object.freeze([
  "# Phase 004 확장 호스트 수동 검증 기록",
  "## 1. 검증 세션",
  "## 2. 환경",
  "## 3. 실행 명령",
  "## 4. 체크리스트 결과 요약",
  "## 5. 실패 또는 차단 항목",
  "## 6. 검증 증거 메모",
  "## 7. 릴리스 판단",
]);

export async function runReleaseGate({
  runCommand = runCommandWithSpawn,
  checkFile = access,
  readTextFile = readFile,
  checkPackagingCapability = evaluateVsixCandidatePackaging,
} = {}) {
  for (const check of CHECKS) {
    const result = await runCommand(check);
    if (!result.ok) {
      return {
        ok: false,
        failureCode: check.failureCode,
        failedCheck: check.name,
      };
    }
  }

  try {
    await checkFile(SMOKE_CHECKLIST_PATH);
  } catch {
    return {
      ok: false,
      failureCode: "DocsFailed",
      failedCheck: "docs",
    };
  }

  let smokeChecklist;
  try {
    smokeChecklist = await readTextFile(SMOKE_CHECKLIST_PATH, "utf8");
  } catch {
    return {
      ok: false,
      failureCode: "DocsFailed",
      failedCheck: "docs",
    };
  }

  if (!validSmokeChecklist(smokeChecklist)) {
    return {
      ok: false,
      failureCode: "SmokeMissing",
      failedCheck: "smoke",
    };
  }

  try {
    await checkFile(SMOKE_EVIDENCE_PATH);
  } catch {
    return {
      ok: false,
      failureCode: "DocsFailed",
      failedCheck: "docs",
    };
  }

  let smokeEvidence;
  try {
    smokeEvidence = await readTextFile(SMOKE_EVIDENCE_PATH, "utf8");
  } catch {
    return {
      ok: false,
      failureCode: "DocsFailed",
      failedCheck: "docs",
    };
  }

  if (!validSmokeEvidence(smokeEvidence)) {
    return {
      ok: false,
      failureCode: "SmokeMissing",
      failedCheck: "smoke",
    };
  }

  const packagingResult = await checkPackagingCapability({ mode: "check" });
  if (!packagingResult.ok) {
    return {
      ok: false,
      failureCode: packagingResult.code ?? "PackageFailed",
      failedCheck: "packaging",
    };
  }

  const checked = [
    ...CHECKS.map((check) => check.name),
    "docs",
    "smoke",
    "evidence",
    "packaging",
  ];

  if (packagingResult.status === "skipped") {
    return {
      ok: true,
      checked,
      skipped: [
        {
          check: "packaging",
          code: packagingResult.code,
          message: packagingResult.message,
        },
      ],
    };
  }

  return {
    ok: true,
    checked,
  };
}

if (isDirectExecution()) {
  const result = await runReleaseGate();
  if (!result.ok) {
    console.error(`release-gate failed: ${result.failureCode}`);
    process.exitCode = 1;
  } else {
    const skipped = result.skipped?.length
      ? ` (skipped: ${result.skipped.map((check) => check.code).join(", ")})`
      : "";
    console.log(`release-gate ok: ${result.checked.join(", ")}${skipped}`);
  }
}

function isDirectExecution() {
  return path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
}

function runCommandWithSpawn({ command, args }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
    });
    child.on("exit", (code) => resolve({ ok: code === 0, code }));
    child.on("error", () => resolve({ ok: false }));
  });
}

function validSmokeChecklist(content) {
  return REQUIRED_SMOKE_MARKERS.every((marker) => content.includes(marker));
}

function validSmokeEvidence(content) {
  return REQUIRED_EVIDENCE_MARKERS.every((marker) => content.includes(marker));
}
