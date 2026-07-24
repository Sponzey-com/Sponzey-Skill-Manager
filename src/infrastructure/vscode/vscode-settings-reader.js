export function createVsCodeSettingsReader({ workspace }) {
  return {
    async readSettings() {
      const configuration = workspace.getConfiguration("sponzeySkills");

      return {
        mainRepositoryPath: configuration.get("mainRepositoryPath", ""),
        enabledClients: configuration.get("enabledClients", [
          "codex",
          "claude",
        ]),
        globalTargets: configuration.get("globalTargets", []),
        projectTargetPatterns: configuration.get("projectTargetPatterns", [
          ".agents/skills",
          ".claude/skills",
        ]),
        defaultApplyMode: configuration.get("defaultApplyMode", "copy"),
        riskPolicy: configuration.get("riskPolicy", {}),
        backupPolicy: configuration.get("backupPolicy", {}),
        loggingPolicy: configuration.get("loggingPolicy", {}),
      };
    },
  };
}

export function createVsCodeSettingsWriter({
  workspace,
  ConfigurationTarget = workspace?.ConfigurationTarget,
}) {
  return {
    async updateMainRepositoryPath({ mainRepositoryPath }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        await configuration.update(
          "mainRepositoryPath",
          mainRepositoryPath,
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          mainRepositoryPath,
        };
      } catch (error) {
        return {
          ok: false,
          error: {
            code: "settings-write-failed",
            severity: "error",
            message: withCause(
              "Failed to update main repository setting.",
              error,
            ),
          },
        };
      }
    },
    async clearMainRepositoryPath() {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        await configuration.update(
          "mainRepositoryPath",
          "",
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          mainRepositoryPath: "",
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to clear main repository setting.",
          error,
        );
      }
    },
    async addGlobalTarget({ targetPath, clientType }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        const targets = configuration.get("globalTargets", []);
        const normalizedPath = normalizePath(targetPath);
        const target = {
          id: `global:${clientType}:${normalizedPath}`,
          clientType,
          scope: "global",
          targetPath: normalizedPath,
        };

        if (
          targets.some(
            (currentTarget) =>
              currentTarget.id === target.id ||
              (currentTarget.clientType === target.clientType &&
                normalizePath(currentTarget.targetPath) === target.targetPath),
          )
        ) {
          return {
            ok: false,
            error: {
              code: "global-target-conflict",
              severity: "error",
              message: "Global repository target already exists.",
            },
          };
        }

        await configuration.update(
          "globalTargets",
          [...targets, target],
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          target,
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to add global repository target.",
          error,
        );
      }
    },
    async addGlobalTargets({ targets }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        const currentTargets = configuration.get("globalTargets", []);
        const nextTargets = (targets ?? []).map((target) => {
          const normalizedPath = normalizePath(target?.targetPath);
          return {
            id: `global:${target?.clientType}:${normalizedPath}`,
            clientType: target?.clientType,
            scope: "global",
            targetPath: normalizedPath,
          };
        });

        const seen = new Set();
        for (const target of nextTargets) {
          const key = `${target.clientType}:${target.targetPath}`;
          if (
            seen.has(key) ||
            currentTargets.some(
              (currentTarget) =>
                currentTarget.id === target.id ||
                (currentTarget.clientType === target.clientType &&
                  normalizePath(currentTarget.targetPath) === target.targetPath),
            )
          ) {
            return {
              ok: false,
              error: {
                code: "global-target-conflict",
                severity: "error",
                message: "Global repository target already exists.",
              },
            };
          }
          seen.add(key);
        }

        await configuration.update(
          "globalTargets",
          [...currentTargets, ...nextTargets],
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          target: nextTargets[0],
          targets: nextTargets,
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to add global repository targets.",
          error,
        );
      }
    },
    async removeGlobalTarget({ targetId }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        const targets = configuration.get("globalTargets", []);
        const nextTargets = targets.filter((target) => target.id !== targetId);

        if (nextTargets.length === targets.length) {
          return {
            ok: false,
            error: {
              code: "global-target-not-found",
              severity: "error",
              message: "Global repository target was not found.",
            },
          };
        }

        await configuration.update(
          "globalTargets",
          nextTargets,
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          removedTargetId: targetId,
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to remove global repository target.",
          error,
        );
      }
    },
    async addProjectTargetPattern({ targetPattern }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        const patterns = configuration.get("projectTargetPatterns", []);
        const normalizedPattern = normalizeRelativePattern(targetPattern);
        const currentPatterns = uniqueNormalizedPatterns(patterns);

        if (currentPatterns.includes(normalizedPattern)) {
          return {
            ok: true,
            targetPattern: normalizedPattern,
            targetPatterns: [normalizedPattern],
            addedTargetPatterns: [],
            changed: false,
          };
        }

        const nextPatterns = [...currentPatterns, normalizedPattern];
        await configuration.update(
          "projectTargetPatterns",
          nextPatterns,
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          targetPattern: normalizedPattern,
          targetPatterns: [normalizedPattern],
          addedTargetPatterns: [normalizedPattern],
          changed: true,
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to add project repository pattern.",
          error,
        );
      }
    },
    async addProjectTargetPatterns({ targetPatterns }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        const patterns = configuration.get("projectTargetPatterns", []);
        const currentPatterns = uniqueNormalizedPatterns(patterns);
        const normalizedPatterns = uniqueNormalizedPatterns(targetPatterns);
        const currentPatternSet = new Set(currentPatterns);
        const addedTargetPatterns = normalizedPatterns.filter(
          (targetPattern) => !currentPatternSet.has(targetPattern),
        );

        if (addedTargetPatterns.length > 0) {
          await configuration.update(
            "projectTargetPatterns",
            [...currentPatterns, ...addedTargetPatterns],
            ConfigurationTarget?.Global ?? true,
          );
        }

        return {
          ok: true,
          targetPattern: normalizedPatterns[0],
          targetPatterns: normalizedPatterns,
          addedTargetPatterns,
          changed: addedTargetPatterns.length > 0,
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to add project repository patterns.",
          error,
        );
      }
    },
    async removeProjectTargetPattern({ targetPattern }) {
      try {
        const configuration = workspace.getConfiguration("sponzeySkills");
        const patterns = configuration.get("projectTargetPatterns", []);
        const normalizedPattern = normalizeRelativePattern(targetPattern);
        const nextPatterns = patterns.filter((pattern) => pattern !== normalizedPattern);

        if (nextPatterns.length === patterns.length) {
          return {
            ok: false,
            error: {
              code: "project-target-pattern-not-found",
              severity: "error",
              message: "Project repository pattern was not found.",
            },
          };
        }

        await configuration.update(
          "projectTargetPatterns",
          nextPatterns,
          ConfigurationTarget?.Global ?? true,
        );

        return {
          ok: true,
          removedTargetPattern: normalizedPattern,
        };
      } catch (error) {
        return settingsWriteFailed(
          "Failed to remove project repository pattern.",
          error,
        );
      }
    },
  };
}

export function createVsCodeRepositoryOpener({ env, Uri, workspace, window }) {
  return {
    async openPath({ path, openMode = "external" }) {
      try {
        if (
          openMode === "editor" &&
          typeof workspace?.openTextDocument === "function" &&
          typeof window?.showTextDocument === "function"
        ) {
          const document = await workspace.openTextDocument(Uri.file(path));
          await window.showTextDocument(document, { preview: false });

          return {
            ok: true,
            path,
          };
        }

        const opened = await env.openExternal(Uri.file(path));

        if (opened === false) {
          return {
            ok: false,
            error: {
              code: "repository-open-failed",
              severity: "error",
              message: "Failed to open main repository.",
            },
          };
        }

        return {
          ok: true,
          path,
        };
      } catch (error) {
        return {
          ok: false,
          error: {
            code: "repository-open-failed",
            severity: "error",
            message: withCause("Failed to open main repository.", error),
          },
        };
      }
    },
  };
}

export function readVsCodeWorkspaceRoots(workspace) {
  return (workspace.workspaceFolders ?? [])
    .map((folder) => folder?.uri?.fsPath)
    .filter((fsPath) => typeof fsPath === "string" && fsPath.length > 0);
}

function normalizePath(value) {
  const normalized = String(value ?? "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function normalizeRelativePattern(value) {
  return normalizePath(value).replace(/^\/+/, "");
}

function settingsWriteFailed(message, error) {
  return {
    ok: false,
    error: {
      code: "settings-write-failed",
      severity: "error",
      message: withCause(message, error),
    },
  };
}

function withCause(message, error) {
  const cause = errorMessage(error);

  if (!cause) {
    return message;
  }

  return `${message} ${cause}`;
}

function errorMessage(error) {
  if (typeof error?.message === "string" && error.message.trim().length > 0) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error.trim();
  }

  return "";
}

function uniqueNormalizedPatterns(patterns) {
  return [...new Set((patterns ?? []).map(normalizeRelativePattern))];
}
