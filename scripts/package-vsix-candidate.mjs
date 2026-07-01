import { spawn } from "node:child_process";
import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_OUTPUT_DIR = ".dist";
const PACKAGE_COMMAND_ARGS = Object.freeze(["package"]);

export async function evaluateVsixCandidatePackaging({
  cwd = process.cwd(),
  mode = "check",
  checkFile = access,
  makeDirectory = mkdir,
  readTextFile = readFile,
  runCommand = runCommandWithSpawn,
} = {}) {
  const toolPath = localVscePath(cwd);

  try {
    await checkFile(toolPath);
  } catch {
    return {
      ok: mode === "check",
      status: "skipped",
      code: "PackagingToolMissing",
      checked: "packaging",
      toolPath,
      message:
        "Local VSIX packaging skipped because node_modules/.bin/vsce was not found. Install @vscode/vsce as a dev dependency before creating a local VSIX candidate.",
    };
  }

  if (mode === "check") {
    return {
      ok: true,
      status: "available",
      code: "PackagingToolAvailable",
      checked: "packaging",
      toolPath,
      message: "Local VSIX packaging tool is available.",
    };
  }

  const packageJson = await readPackageJson({ cwd, readTextFile });
  const outputDirectory = path.join(cwd, DEFAULT_OUTPUT_DIR);
  const outputPath = path.join(outputDirectory, buildVsixCandidateFileName(packageJson));
  await makeDirectory(outputDirectory, { recursive: true });

  const packageResult = await runCommand({
    command: toolPath,
    args: [...PACKAGE_COMMAND_ARGS, "--out", outputPath],
  });

  if (!packageResult.ok) {
    return {
      ok: false,
      status: "failed",
      code: "PackageFailed",
      checked: "packaging",
      toolPath,
      outputPath,
      message: "Local VSIX packaging command failed.",
    };
  }

  return {
    ok: true,
    status: "packaged",
    code: "PackageCreated",
    checked: "packaging",
    toolPath,
    outputPath,
    message: "Local VSIX candidate package created.",
  };
}

export function buildVsixCandidateFileName(packageJson) {
  const name = safeArtifactSegment(packageJson?.name, "extension");
  const version = safeArtifactSegment(packageJson?.version, "0.0.0");
  return `${name}-${version}.vsix`;
}

if (isDirectExecution()) {
  const result = await evaluateVsixCandidatePackaging({
    mode: process.argv.includes("--package") ? "package" : "check",
  });

  const output = result.outputPath ? `${result.message} ${result.outputPath}` : result.message;
  if (result.ok) {
    console.log(`vsix-candidate ${result.status}: ${output}`);
  } else {
    console.error(`vsix-candidate failed: ${result.code} - ${output}`);
    process.exitCode = 1;
  }
}

function localVscePath(cwd) {
  const executable = process.platform === "win32" ? "vsce.cmd" : "vsce";
  return path.join(cwd, "node_modules", ".bin", executable);
}

async function readPackageJson({ cwd, readTextFile }) {
  return JSON.parse(await readTextFile(path.join(cwd, "package.json"), "utf8"));
}

function safeArtifactSegment(value, fallback) {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
