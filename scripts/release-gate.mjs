import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const SMOKE_CHECKLIST_PATH = ".tasks/release-smoke.md";
const REQUIRED_SMOKE_MARKERS = Object.freeze([
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
]);

export async function runReleaseGate({
  runCommand = runCommandWithSpawn,
  checkFile = access,
  readTextFile = readFile,
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

  return {
    ok: true,
    checked: [...CHECKS.map((check) => check.name), "docs", "smoke"],
  };
}

if (isDirectExecution()) {
  const result = await runReleaseGate();
  if (!result.ok) {
    console.error(`release-gate failed: ${result.failureCode}`);
    process.exitCode = 1;
  } else {
    console.log(`release-gate ok: ${result.checked.join(", ")}`);
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
