import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class LocalGitVersionControlPort {
  constructor({
    commandRunner = defaultCommandRunner,
    clock = () => new Date().toISOString(),
  } = {}) {
    this.commandRunner = commandRunner;
    this.clock = clock;
  }

  async getRepositoryStatus({ repositoryPath }) {
    try {
      const result = await this.commandRunner({
        command: "git",
        args: [
          "-C",
          repositoryPath,
          "status",
          "--porcelain=v1",
          "--untracked-files=all",
        ],
      });

      if (result?.ok === false) {
        return gitStatusFailed(result.error);
      }

      const entries = parsePorcelainStatus(result?.stdout ?? "");

      return {
        ok: true,
        status: entries.length > 0 ? "dirty" : "clean",
        checkedAt: this.clock(),
        entries,
      };
    } catch (error) {
      if (error?.code === "ENOENT") {
        return gitUnavailable();
      }

      if (isNotGitRepositoryError(error)) {
        return {
          ok: true,
          status: "not-git-repository",
          checkedAt: this.clock(),
          entries: [],
        };
      }

      return gitStatusFailed(error);
    }
  }

  async createSnapshot({ repositoryPath, message, paths = [] }) {
    const stagePaths = normalizeSnapshotPaths(paths);

    try {
      const addResult = await this.commandRunner({
        command: "git",
        args: ["-C", repositoryPath, "add", "--", ...stagePaths],
      });
      if (addResult?.ok === false) {
        return snapshotFailed(addResult.error);
      }

      const commitResult = await this.commandRunner({
        command: "git",
        args: ["-C", repositoryPath, "commit", "-m", message],
      });
      if (commitResult?.ok === false) {
        return snapshotFailed(commitResult.error);
      }

      const hashResult = await this.commandRunner({
        command: "git",
        args: ["-C", repositoryPath, "rev-parse", "HEAD"],
      });
      if (hashResult?.ok === false) {
        return snapshotFailed(hashResult.error);
      }

      return {
        ok: true,
        commitHash: String(hashResult?.stdout ?? "").trim(),
      };
    } catch (error) {
      return snapshotFailed(error);
    }
  }
}

function parsePorcelainStatus(stdout) {
  return String(stdout ?? "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parsePorcelainLine)
    .filter((entry) => entry.path.length > 0);
}

function parsePorcelainLine(line) {
  const statusCode = line.slice(0, 2);
  const rawPath = line.slice(3).trim();
  const path = normalizeGitPath(rawPath.includes(" -> ")
    ? rawPath.split(" -> ").at(-1)
    : rawPath);

  return {
    path,
    status: statusName(statusCode),
  };
}

function statusName(statusCode) {
  if (statusCode === "??") {
    return "untracked";
  }
  if (statusCode.includes("A")) {
    return "added";
  }
  if (statusCode.includes("D")) {
    return "deleted";
  }
  if (statusCode.includes("R")) {
    return "renamed";
  }
  if (statusCode.includes("C")) {
    return "copied";
  }
  if (statusCode.includes("M")) {
    return "modified";
  }

  return "changed";
}

function normalizeGitPath(value) {
  return String(value ?? "")
    .replace(/^"|"$/g, "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");
}

function normalizeSnapshotPaths(paths) {
  const normalizedPaths = Array.isArray(paths)
    ? paths
        .map((path) => normalizeGitPath(path))
        .filter((path) => path.length > 0)
    : [];

  return normalizedPaths.length > 0 ? normalizedPaths : ["."];
}

function isNotGitRepositoryError(error) {
  return String(error?.stderr ?? error?.message ?? "")
    .toLowerCase()
    .includes("not a git repository");
}

function isEmptyCommitError(error) {
  const text = String(error?.stderr ?? error?.message ?? "").toLowerCase();
  return (
    text.includes("nothing to commit") ||
    text.includes("no changes added to commit")
  );
}

function gitUnavailable() {
  return {
    ok: false,
    error: {
      code: "git-unavailable",
      severity: "warning",
      category: "version-control",
      message: "Git command is unavailable.",
      recommendation: "Install Git to enable Main Repository version status.",
    },
  };
}

function gitStatusFailed(error) {
  return {
    ok: false,
    error: {
      code: "git-status-failed",
      severity: "warning",
      category: "version-control",
      message: "Git status could not be read.",
      cause: error?.code,
    },
  };
}

function notGitRepository() {
  return {
    ok: false,
    error: {
      code: "not-git-repository",
      severity: "warning",
      category: "version-control",
      message: "Main Repository is not a Git repository.",
    },
  };
}

function repositorySnapshotEmpty() {
  return {
    ok: false,
    error: {
      code: "repository-snapshot-empty",
      severity: "warning",
      category: "version-control",
      message: "Repository snapshot has no staged changes to commit.",
    },
  };
}

function snapshotFailed(error) {
  if (error?.code === "ENOENT") {
    return gitUnavailable();
  }

  if (isNotGitRepositoryError(error)) {
    return notGitRepository();
  }

  if (isEmptyCommitError(error)) {
    return repositorySnapshotEmpty();
  }

  return {
    ok: false,
    error: {
      code: "repository-snapshot-failed",
      severity: "warning",
      category: "version-control",
      message: "Repository snapshot could not be created.",
      cause: error?.code,
    },
  };
}

async function defaultCommandRunner({ command, args }) {
  const { stdout, stderr } = await execFileAsync(command, args);
  return {
    ok: true,
    stdout,
    stderr,
  };
}
