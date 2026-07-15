import { execFile } from "node:child_process";
import { access, mkdtemp, readdir, rm } from "node:fs/promises";
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

  async resolveInstallSources({ reference }) {
    const normalizedReference = String(reference ?? "").trim();
    const githubReference = parseGitHubReference(normalizedReference);

    if (!githubReference) {
      return invalidGitHubInstallSourceReference();
    }

    const cloned = await this.cloneGitHubRepository({ githubReference });
    if (!cloned.ok) {
      return cloned;
    }

    const discoveryRootResult = resolveDiscoveryRoot({
      clonePath: cloned.clonePath,
      subPath: githubReference.subPath,
    });
    if (!discoveryRootResult.ok) {
      await cloned.cleanup();
      return discoveryRootResult;
    }

    const discoveredPaths = await discoverSkillDirectories(
      discoveryRootResult.discoveryRootPath,
    );
    if (discoveredPaths.length === 0) {
      await cloned.cleanup();
      return installSourcesNotFound();
    }

    return {
      ok: true,
      sources: discoveredPaths.map((sourcePath) => {
        const relativeSourcePath = normalizeRelativePath(
          path.relative(cloned.clonePath, sourcePath),
        );
        return {
          name: path.basename(sourcePath),
          sourcePath,
          origin: compactObject({
            type: "github",
            url: normalizedReference,
            cloneUrl: githubReference.cloneUrl,
            ref: githubReference.ref,
            subPath: relativeSourcePath,
          }),
        };
      }),
      cleanup: cloned.cleanup,
    };
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
    const cloned = await this.cloneGitHubRepository({ githubReference });
    if (!cloned.ok) {
      return cloned;
    }

    const sourcePath = githubReference.subPath
      ? path.join(cloned.clonePath, githubReference.subPath)
      : cloned.clonePath;
    const validation = await validateSkillSourcePath({ sourcePath });

    if (!validation.ok) {
      await cloned.cleanup();
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
      cleanup: cloned.cleanup,
    };
  }

  async cloneGitHubRepository({ githubReference }) {
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

    return {
      ok: true,
      clonePath,
      cleanup: async () => {
        await this.removeDirectory(tempRootPath);
      },
    };
  }
}

const IGNORED_DISCOVERY_DIRECTORIES = new Set([
  ".git",
  ".sponzey",
  "node_modules",
]);

async function discoverSkillDirectories(rootPath) {
  if (await containsSkillMarkdown(rootPath)) {
    return [rootPath];
  }

  let entries;
  try {
    entries = await readdir(rootPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const directories = entries
    .filter(
      (entry) =>
        entry.isDirectory() && !IGNORED_DISCOVERY_DIRECTORIES.has(entry.name),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
  const discovered = [];

  for (const directory of directories) {
    discovered.push(
      ...(await discoverSkillDirectories(path.join(rootPath, directory.name))),
    );
  }

  return discovered;
}

async function containsSkillMarkdown(directoryPath) {
  try {
    await access(path.join(directoryPath, "SKILL.md"));
    return true;
  } catch {
    return false;
  }
}

function resolveDiscoveryRoot({ clonePath, subPath }) {
  const resolvedClonePath = path.resolve(clonePath);
  const discoveryRootPath = path.resolve(clonePath, subPath ?? ".");
  const relativePath = path.relative(resolvedClonePath, discoveryRootPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return invalidGitHubFolderPath();
  }

  return {
    ok: true,
    discoveryRootPath,
  };
}

function normalizeRelativePath(value) {
  return String(value ?? "").replaceAll("\\", "/");
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

function invalidGitHubInstallSourceReference() {
  return {
    ok: false,
    error: {
      code: "invalid-github-install-source-reference",
      severity: "error",
      message: "Recursive install requires a GitHub repository or folder URL.",
    },
  };
}

function invalidGitHubFolderPath() {
  return {
    ok: false,
    error: {
      code: "invalid-github-folder-path",
      severity: "error",
      message: "Selected GitHub folder must remain inside the cloned repository.",
    },
  };
}

function installSourcesNotFound() {
  return {
    ok: false,
    error: {
      code: "install-source-skills-not-found",
      severity: "error",
      message: "No SKILL.md files were found below the selected GitHub folder.",
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
