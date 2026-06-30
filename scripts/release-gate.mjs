import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
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

export async function runReleaseGate({
  runCommand = runCommandWithSpawn,
  checkFile = access,
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
    await checkFile(".tasks/release-smoke.md");
  } catch {
    return {
      ok: false,
      failureCode: "DocsFailed",
      failedCheck: "docs",
    };
  }

  return {
    ok: true,
    checked: [...CHECKS.map((check) => check.name), "docs"],
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
