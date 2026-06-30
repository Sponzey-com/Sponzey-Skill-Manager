import { execFile } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class LocalGitSkillSourceResolver {
  constructor({
    commandRunner = defaultCommandRunner,
    tempDirectoryFactory = defaultTempDirectoryFactory,
    removeDirectory = defaultRemoveDirectory,
  } = {}) {
    this.commandRunner = commandRunner;
    this.tempDirectoryFactory = tempDirectoryFactory;
    this.removeDirectory = removeDirectory;
  }

  async resolveInstallSource({ reference }) {
    const normalizedReference = String(reference ?? "").trim();

    if (normalizedReference.length === 0) {
      return invalidInstallSourceReference();
    }

    const githubReference = parseGitHubReference(normalizedReference);
    if (githubReference) {
      return this.resolveGitHubInstallSource({
        reference: normalizedReference,
        githubReference,
      });
    }

    return this.resolveLocalInstallSource({
      reference: normalizedReference,
    });
  }

  async resolveLocalInstallSource({ reference }) {
    const sourcePath = path.resolve(reference);
    const validation = await validateSkillSourcePath({ sourcePath });

    if (!validation.ok) {
      return validation;
    }

    return {
      ok: true,
      sourcePath,
      origin: {
        type: "local-path",
        path: sourcePath,
      },
      async cleanup() {},
    };
  }

  async resolveGitHubInstallSource({ reference, githubReference }) {
    const tempRootPath = await this.tempDirectoryFactory();
    const clonePath = path.join(tempRootPath, "repo");
    const args = buildGitCloneArgs({ githubReference, clonePath });

    try {
      const commandResult = await this.commandRunner({
        command: "git",
        args,
      });

      if (commandResult?.ok === false) {
        await this.removeDirectory(tempRootPath);
        return sourceDownloadFailed(commandResult.error);
      }
    } catch (error) {
      await this.removeDirectory(tempRootPath);
      return sourceDownloadFailed(error);
    }

    const sourcePath = githubReference.subPath
      ? path.join(clonePath, githubReference.subPath)
      : clonePath;
    const validation = await validateSkillSourcePath({ sourcePath });

    if (!validation.ok) {
      await this.removeDirectory(tempRootPath);
      return validation;
    }

    return {
      ok: true,
      sourcePath,
      origin: compactObject({
        type: "github",
        url: reference,
        cloneUrl: githubReference.cloneUrl,
        ref: githubReference.ref,
        subPath: githubReference.subPath,
      }),
      cleanup: async () => {
        await this.removeDirectory(tempRootPath);
      },
    };
  }
}

function buildGitCloneArgs({ githubReference, clonePath }) {
  const args = ["clone", "--depth", "1"];

  if (githubReference.ref) {
    args.push("--branch", githubReference.ref);
  }

  args.push(githubReference.cloneUrl, clonePath);
  return args;
}

function parseGitHubReference(reference) {
  const sshMatch = reference.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, owner, rawRepo] = sshMatch;
    const repo = stripGitSuffix(rawRepo);

    if (owner.length > 0 && repo.length > 0) {
      return {
        cloneUrl: `git@github.com:${owner}/${repo}.git`,
      };
    }
  }

  let url;
  try {
    url = new URL(reference);
  } catch {
    return null;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.hostname.toLowerCase() !== "github.com"
  ) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const [owner, rawRepo] = segments;
  const repo = stripGitSuffix(rawRepo);
  if (owner.length === 0 || repo.length === 0) {
    return null;
  }

  const referenceParts = {
    cloneUrl: `https://github.com/${owner}/${repo}.git`,
  };

  if (segments[2] === "tree" && segments[3]) {
    referenceParts.ref = segments[3];
    const subPath = segments.slice(4).join("/");
    if (subPath.length > 0) {
      referenceParts.subPath = subPath;
    }
  }

  return referenceParts;
}

async function validateSkillSourcePath({ sourcePath }) {
  try {
    await access(path.join(sourcePath, "SKILL.md"));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: {
        code: "install-source-skill-md-missing",
        severity: "error",
        message: "Install source must contain SKILL.md at its root.",
      },
    };
  }
}

function stripGitSuffix(value) {
  return String(value ?? "").replace(/\.git$/, "");
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

function invalidInstallSourceReference() {
  return {
    ok: false,
    error: {
      code: "invalid-install-source-reference",
      severity: "error",
      message: "Install source reference must be a GitHub URL or local path.",
    },
  };
}

function sourceDownloadFailed(error) {
  return {
    ok: false,
    error: {
      code: "install-source-download-failed",
      severity: "error",
      message: "GitHub skill download failed. Check the URL and git availability.",
      cause: error?.code,
    },
  };
}

async function defaultCommandRunner({ command, args }) {
  await execFileAsync(command, args);
  return { ok: true };
}

async function defaultTempDirectoryFactory() {
  return mkdtemp(path.join(tmpdir(), "sponzey-skill-install-"));
}

async function defaultRemoveDirectory(directoryPath) {
  await rm(directoryPath, {
    recursive: true,
    force: true,
  });
}
