import { homedir } from "node:os";

import {
  createRefreshInvalidationController,
  describeApplicationLayer,
  routeLogEvents,
} from "./application/index.js";
import { createExtensionComposition } from "./extension-composition.js";
import {
  createRuntimeSession,
  createRuntimeSessionCommandHandlers,
} from "./extension-runtime-session.js";
import {
  FileSystemTransferAuditStore,
  createVsCodeOutputChannelLogger,
  createVsCodeRepositoryOpener,
  createVsCodeSettingsReader,
  createVsCodeSettingsWriter,
  describeInfrastructureLayer,
  readVsCodeWorkspaceRoots,
} from "./infrastructure/index.js";
import {
  createCommandHandlers,
  createSkillsTreeDataProviders,
  describePresentationLayer,
  refreshSponzeyTreeDataProviders,
  registerSponzeyCommands,
  registerSponzeyTreeDataProviders,
  wrapCommandHandlerWithResultRendering,
  wrapCommandHandlersWithInputCollection,
} from "./presentation/index.js";

export async function activate(context, runtime = {}) {
  const vscodeApi = runtime.vscodeApi ?? (await loadVscodeApi());
  const commandsApi = runtime.commandsApi ?? vscodeApi?.commands;
  const adapters = createAdapters({ runtime, vscodeApi });
  const defaultMainRepositoryPath =
    runtime.defaultMainRepositoryPath ?? createDefaultMainRepositoryPath();
  const defaultGlobalTargets =
    runtime.defaultGlobalTargets ?? createDefaultGlobalTargets();
  const composition = await createComposition({
    runtime,
    vscodeApi,
    adapters,
  });
  const runtimeSession = createRuntimeSession({
    initialComposition: composition,
    compose: () => createComposition({ runtime, vscodeApi, adapters }),
  });
  const handlers =
    composition?.commandHandlers
      ? createRuntimeSessionCommandHandlers({
          session: runtimeSession,
          fallbackHandlers: createCommandHandlers(runtime.handlers),
        })
      : createCommandHandlers(runtime.handlers);
  const inputReadModelLoader = composition
    ? createTreeReadModelLoader({ runtimeSession })
    : null;
  const inputWindow = selectInputWindow({ runtime, vscodeApi });
  const handlersWithInputCollection = inputWindow
    ? wrapCommandHandlersWithInputCollection({
        handlers,
        window: inputWindow,
        loadReadModel: inputReadModelLoader,
        defaultGlobalTargets,
      })
    : handlers;
  const treeDataProviders = createTreeDataProviders({
    runtimeSession,
    vscodeApi,
    extensionUri: context?.extensionUri,
  });
  const handlersWithRefreshUpdates = treeDataProviders
    ? wrapRefreshHandlerWithTreeDataProviderUpdate({
        handlers: handlersWithInputCollection,
        providers: treeDataProviders,
      })
    : handlersWithInputCollection;
  const handlersWithTreeUpdates = wrapRuntimeMutationHandlers({
    handlers: handlersWithRefreshUpdates,
    runtimeSession,
    providers: treeDataProviders,
    defaultMainRepositoryPath,
    defaultGlobalTargets,
  });
  const handlersWithLogging = wrapCommandHandlersWithLogging({
    handlers: wrapCommandHandlersWithAudit({
      handlers: handlersWithTreeUpdates,
      auditStore: adapters.auditStore,
      runtimeSession,
    }),
    logger: adapters.logger,
  });
  const rendererWindow = selectRendererWindow({ runtime, vscodeApi });
  const handlersForRegistration = rendererWindow
    ? wrapCommandHandlersWithResultRendering({
        handlers: handlersWithLogging,
        window: rendererWindow,
      })
    : handlersWithLogging;
  const disposables = commandsApi
    ? registerSponzeyCommands({
        commandsApi,
        handlers: handlersForRegistration,
      })
    : [];
  const treeDataProviderDisposables = registerTreeDataProviders({
    providers: treeDataProviders,
    vscodeApi,
  });
  const watcherDisposables = registerRefreshWatchers({
    runtimeSession,
    providers: treeDataProviders,
    vscodeApi,
    logger: adapters.logger,
  });

  if (context?.subscriptions) {
    context.subscriptions.push(
      ...disposables,
      ...treeDataProviderDisposables,
      ...watcherDisposables,
    );
  }

  return {
    application: describeApplicationLayer(),
    infrastructure: describeInfrastructureLayer(),
    presentation: describePresentationLayer(),
    registeredCommandCount: disposables.length,
    registeredTreeDataProviderCount: treeDataProviderDisposables.length,
    registeredWatcherCount: watcherDisposables.length,
    composition: runtimeSession.getComposition(),
    runtimeSession,
  };
}

export function deactivate() {}

function wrapCommandHandlersWithResultRendering({ handlers, window }) {
  return Object.fromEntries(
    Object.entries(handlers).map(([commandId, handler]) => [
      commandId,
      wrapCommandHandlerWithResultRendering({ handler, window }),
    ]),
  );
}

function wrapCommandHandlersWithLogging({ handlers, logger }) {
  return Object.fromEntries(
    Object.entries(handlers).map(([commandId, handler]) => [
      commandId,
      async (input) => {
        const result = await handler(input);
        await routeLogEvents({ events: result?.events ?? [], logger });
        return result;
      },
    ]),
  );
}

function wrapCommandHandlersWithAudit({ handlers, auditStore, runtimeSession }) {
  if (typeof auditStore?.appendRecord !== "function") {
    return handlers;
  }

  return Object.fromEntries(
    Object.entries(handlers).map(([commandId, handler]) => [
      commandId,
      async (input) => {
        const result = await handler(input);
        const auditEvents = (result?.events ?? []).filter((event) =>
          shouldAuditEvent(event),
        );

        for (const event of auditEvents) {
          const auditResult = await auditStore.appendRecord({
            repositoryPath:
              runtimeSession.getComposition()?.context?.mainRepositoryPath ?? "",
            record: {
              operationId: `${Date.now()}:${commandId}`,
              commandId,
              status: result?.ok === true ? "completed" : "failed",
              eventCode: event.code,
              diagnostics: (result?.diagnostics ?? []).map(
                (diagnostic) => diagnostic.code,
              ),
            },
          });

          if (!auditResult.ok) {
            result.diagnostics = [
              ...(result.diagnostics ?? []),
              auditResult.error,
            ];
          }
        }

        return result;
      },
    ]),
  );
}

function shouldAuditEvent(event) {
  return /^skill\.(?:transfer|backup|source|apply)/.test(event?.code ?? "");
}

function selectRendererWindow({ runtime, vscodeApi }) {
  const window = runtime.window ?? vscodeApi?.window;

  if (
    typeof window?.showInformationMessage === "function" &&
    typeof window?.showWarningMessage === "function" &&
    typeof window?.showErrorMessage === "function"
  ) {
    return window;
  }

  return null;
}

function selectInputWindow({ runtime, vscodeApi }) {
  const window = runtime.window ?? vscodeApi?.window;

  if (typeof window?.showInputBox === "function") {
    return window;
  }

  return null;
}

function createTreeDataProviders({ runtimeSession, vscodeApi, extensionUri }) {
  if (
    !runtimeSession?.getComposition?.() ||
    typeof vscodeApi?.window?.registerTreeDataProvider !== "function"
  ) {
    return null;
  }

  return createSkillsTreeDataProviders({
    loadReadModel: createTreeReadModelLoader({
      runtimeSession,
    }),
    eventEmitterFactory: createTreeEventEmitterFactory({ vscodeApi }),
    themeIconFactory: createThemeIconFactory({ vscodeApi, extensionUri }),
  });
}

function registerTreeDataProviders({ providers, vscodeApi }) {
  if (!providers) {
    return [];
  }

  return registerSponzeyTreeDataProviders({
    windowApi: vscodeApi.window,
    providers,
  });
}

function registerRefreshWatchers({
  runtimeSession,
  providers,
  vscodeApi,
  logger,
}) {
  if (
    !providers ||
    typeof vscodeApi?.workspace?.createFileSystemWatcher !== "function"
  ) {
    return [];
  }

  const composition = runtimeSession.getComposition();
  const context = composition?.context;
  if (!context) {
    return [];
  }

  const refresh = async () => {
    const currentComposition = runtimeSession.getComposition();
    const result =
      await currentComposition?.commandHandlers?.[
        "sponzeySkills.refreshSkills"
      ]?.();

    refreshSponzeyTreeDataProviders({
      providers,
      readModel: result?.readModel,
    });
    await routeLogEvents({ events: result?.events ?? [], logger });
  };
  const controller = createRefreshInvalidationController({
    refresh,
    fieldDebugLog: async (event) => {
      await routeLogEvents({ events: [event], logger });
    },
  });

  const disposables = [];
  for (const watchPath of watchedPathsFromContext(context)) {
    const watcher = vscodeApi.workspace.createFileSystemWatcher(
      watcherPattern({ vscodeApi, watchPath }),
    );
    disposables.push(watcher);
    disposables.push(
      registerWatcherEvent({
        watcher,
        eventName: "onDidCreate",
        type: "create",
        controller,
      }),
      registerWatcherEvent({
        watcher,
        eventName: "onDidChange",
        type: "change",
        controller,
      }),
      registerWatcherEvent({
        watcher,
        eventName: "onDidDelete",
        type: "delete",
        controller,
      }),
    );
  }

  return disposables.filter(Boolean);
}

function registerWatcherEvent({ watcher, eventName, type, controller }) {
  if (typeof watcher?.[eventName] !== "function") {
    return null;
  }

  return watcher[eventName]((uri) =>
    controller.invalidate({
      type,
      path: uri?.fsPath,
    }),
  );
}

function watchedPathsFromContext(context) {
  return [
    context.mainRepositoryPath,
    ...(context.globalTargets ?? []).map((target) => target.targetPath),
    ...(context.projectTargets ?? []).map((target) => target.targetPath),
  ].filter((value) => typeof value === "string" && value.length > 0);
}

function watcherPattern({ vscodeApi, watchPath }) {
  if (typeof vscodeApi?.RelativePattern === "function") {
    return new vscodeApi.RelativePattern(watchPath, "**/*");
  }

  return `${watchPath.replace(/\\/g, "/")}/**/*`;
}

function wrapRefreshHandlerWithTreeDataProviderUpdate({
  handlers,
  providers,
}) {
  const commandId = "sponzeySkills.refreshSkills";

  return {
    ...handlers,
    async [commandId](input) {
      const result = await handlers[commandId](input);
      refreshSponzeyTreeDataProviders({
        providers,
        readModel: result?.readModel,
      });
      return result;
    },
  };
}

function wrapRuntimeMutationHandlers({
  handlers,
  runtimeSession,
  providers,
  defaultMainRepositoryPath,
  defaultGlobalTargets,
}) {
  const refreshCommandId = "sponzeySkills.refreshSkills";
  const refreshHandler = handlers[refreshCommandId];
  const mutationCommandIds = [
    "sponzeySkills.createSkill",
    "sponzeySkills.importSkill",
    "sponzeySkills.installSkill",
    "sponzeySkills.applySkillToGlobalTarget",
    "sponzeySkills.applySkillToProjectTarget",
    "sponzeySkills.removeAppliedSkill",
    "sponzeySkills.analyzeAllSkills",
    "sponzeySkills.updateAppliedCopyFromSource",
    "sponzeySkills.convertAppliedSkillMode",
    "sponzeySkills.copyAppliedSkillToMainRepository",
    "sponzeySkills.backupAppliedSkillToMainRepository",
    "sponzeySkills.moveAppliedSkillToMainRepository",
    "sponzeySkills.renameSourceSkill",
    "sponzeySkills.deleteSourceSkill",
    "sponzeySkills.importSkillArchive",
    "sponzeySkills.promoteBackupToSkillSource",
    "sponzeySkills.deleteBackup",
  ];
  const mainRepositoryReadCommandIds = [
    "sponzeySkills.refreshSkills",
    "sponzeySkills.openMainRepository",
    "sponzeySkills.exportSourceSkill",
    "sponzeySkills.listSkillBackups",
  ];
  const settingsCommandIds = [
    "sponzeySkills.setMainRepository",
    "sponzeySkills.removeMainRepository",
    "sponzeySkills.addGlobalRepository",
    "sponzeySkills.removeGlobalRepository",
    "sponzeySkills.addProjectRepository",
    "sponzeySkills.removeProjectRepository",
  ];

  return {
    ...handlers,
    ...Object.fromEntries(
      mainRepositoryReadCommandIds.map((commandId) => [
        commandId,
        async (input) => {
          const ensureResult = await ensureMainRepository({
            handlers,
            runtimeSession,
            providers,
            refreshHandler,
            defaultMainRepositoryPath,
            refreshAfterSetup: commandId !== refreshCommandId,
          });

          if (!ensureResult.ok) {
            return ensureResult.result;
          }

          return handlers[commandId](input);
        },
      ]),
    ),
    ...Object.fromEntries(
      mutationCommandIds.map((commandId) => [
        commandId,
        async (input) => {
          if (requiresMainRepository(commandId)) {
            const ensureResult = await ensureMainRepository({
              handlers,
              runtimeSession,
              providers,
              refreshHandler,
              defaultMainRepositoryPath,
            });

            if (!ensureResult.ok) {
              return ensureResult.result;
            }
          }

          if (
            commandId === "sponzeySkills.applySkillToGlobalTarget" &&
            !hasCommandTarget(input)
          ) {
            const ensureResult = await ensureGlobalTargets({
              handlers,
              runtimeSession,
              providers,
              refreshHandler,
              defaultGlobalTargets,
            });

            if (!ensureResult.ok) {
              return ensureResult.result;
            }
          }

          const result = await handlers[commandId](input);

          if (result?.ok === true && providers) {
            const refreshResult = await refreshHandler();

            if (isAnalyzeCommand(commandId)) {
              refreshSponzeyTreeDataProviders({
                providers,
                readModel: readModelWithAdditionalDiagnostics({
                  readModel: refreshResult?.readModel,
                  diagnostics: result.diagnostics,
                }),
              });
            }
          }

          return result;
        },
      ]),
    ),
    ...Object.fromEntries(
      settingsCommandIds.map((commandId) => [
        commandId,
        async (input) => {
          const result = await handlers[commandId](input);

          if (result?.ok === true) {
            const recomposeResult = await runtimeSession.recompose();
            if (providers) {
              const refreshResult = await refreshHandler();
              refreshSponzeyTreeDataProviders({
                providers,
                readModel: refreshResult?.readModel,
              });
            }

            return {
              ...result,
              runtimeRecomposition: recomposeResult,
            };
          }

          return result;
        },
      ]),
    ),
  };
}

async function ensureGlobalTargets({
  handlers,
  runtimeSession,
  providers,
  refreshHandler,
  defaultGlobalTargets,
}) {
  const currentTargets =
    runtimeSession.getComposition()?.context?.globalTargets ?? [];

  if (currentTargets.length > 0) {
    return {
      ok: true,
    };
  }

  const defaultTarget = (defaultGlobalTargets ?? []).find(
    (target) => hasText(target?.targetPath) && hasText(target?.clientType),
  );

  if (!defaultTarget) {
    return {
      ok: true,
    };
  }

  const addResult = await handlers["sponzeySkills.addGlobalRepository"]({
    targetPath: defaultTarget.targetPath,
    clientType: defaultTarget.clientType,
  });

  if (addResult?.ok !== true && !isGlobalTargetConflict(addResult)) {
    return {
      ok: false,
      result: addResult,
    };
  }

  const recomposeResult = await runtimeSession.recompose();
  if (recomposeResult?.ok !== true) {
    return {
      ok: false,
      result: recomposeResult,
    };
  }

  const nextTargets =
    runtimeSession.getComposition()?.context?.globalTargets ?? [];
  if (nextTargets.length === 0) {
    return {
      ok: false,
      result: {
        ok: false,
        diagnostics: [
          {
            code: "default-global-target-unavailable",
            severity: "error",
            message: "Default global target could not be registered.",
          },
        ],
        events: [
          {
            level: "ProductLog",
            code: "globalRepository.defaultSetup.failed",
            reason: "default-global-target-unavailable",
          },
        ],
        steps: ["CheckingGlobalTargets", "DefaultTargetUnavailable"],
      },
    };
  }

  if (providers) {
    const refreshResult = await refreshHandler();
    refreshSponzeyTreeDataProviders({
      providers,
      readModel: refreshResult?.readModel,
    });
  }

  return {
    ok: true,
  };
}

async function ensureMainRepository({
  handlers,
  runtimeSession,
  providers,
  refreshHandler,
  defaultMainRepositoryPath,
  refreshAfterSetup = true,
}) {
  const currentPath =
    runtimeSession.getComposition()?.context?.mainRepositoryPath ?? "";

  if (typeof currentPath === "string" && currentPath.trim().length > 0) {
    return {
      ok: true,
    };
  }

  const setInput = hasText(defaultMainRepositoryPath)
    ? { mainRepositoryPath: defaultMainRepositoryPath }
    : undefined;
  const setResult = await handlers["sponzeySkills.setMainRepository"](setInput);
  if (setResult?.ok !== true) {
    return {
      ok: false,
      result: setResult,
    };
  }

  const recomposeResult = await runtimeSession.recompose();
  if (recomposeResult?.ok !== true) {
    return {
      ok: false,
      result: recomposeResult,
    };
  }

  if (providers && refreshAfterSetup) {
    const refreshResult = await refreshHandler();
    refreshSponzeyTreeDataProviders({
      providers,
      readModel: refreshResult?.readModel,
    });
  }

  return {
    ok: true,
  };
}

function createDefaultMainRepositoryPath() {
  const homePath = homedir();

  if (!hasText(homePath)) {
    return "";
  }

  return `${homePath.replace(/\\/g, "/").replace(/\/+$/, "")}/SponzeySkills`;
}

function createDefaultGlobalTargets() {
  const homePath = homedir();

  if (!hasText(homePath)) {
    return [];
  }

  const normalizedHomePath = homePath.replace(/\\/g, "/").replace(/\/+$/, "");

  return [
    {
      clientType: "codex",
      targetPath: `${normalizedHomePath}/.agents/skills`,
    },
    {
      clientType: "claude",
      targetPath: `${normalizedHomePath}/.claude/skills`,
    },
  ];
}

function isGlobalTargetConflict(result) {
  return (result?.diagnostics ?? []).some(
    (diagnostic) => diagnostic?.code === "global-target-conflict",
  );
}

function requiresMainRepository(commandId) {
  return new Set([
    "sponzeySkills.refreshSkills",
    "sponzeySkills.openMainRepository",
    "sponzeySkills.createSkill",
    "sponzeySkills.importSkill",
    "sponzeySkills.installSkill",
    "sponzeySkills.applySkillToGlobalTarget",
    "sponzeySkills.applySkillToProjectTarget",
    "sponzeySkills.analyzeAllSkills",
    "sponzeySkills.updateAppliedCopyFromSource",
    "sponzeySkills.convertAppliedSkillMode",
    "sponzeySkills.copyAppliedSkillToMainRepository",
    "sponzeySkills.backupAppliedSkillToMainRepository",
    "sponzeySkills.moveAppliedSkillToMainRepository",
    "sponzeySkills.renameSourceSkill",
    "sponzeySkills.deleteSourceSkill",
    "sponzeySkills.exportSourceSkill",
    "sponzeySkills.importSkillArchive",
    "sponzeySkills.listSkillBackups",
    "sponzeySkills.promoteBackupToSkillSource",
    "sponzeySkills.deleteBackup",
  ]).has(commandId);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasCommandTarget(input) {
  return hasText(input?.target?.id) && hasText(input?.target?.targetPath);
}

function isAnalyzeCommand(commandId) {
  return commandId === "sponzeySkills.analyzeAllSkills";
}

function readModelWithAdditionalDiagnostics({ readModel, diagnostics }) {
  const baseReadModel = readModel ?? emptyReadModel();

  return {
    ...baseReadModel,
    diagnostics: [
      ...(baseReadModel.diagnostics ?? []),
      ...(Array.isArray(diagnostics) ? diagnostics : []),
    ],
  };
}

function createTreeReadModelLoader({ runtimeSession }) {
  return async () => {
    const composition = runtimeSession.getComposition();

    if (!composition.ok) {
      return emptyReadModel({ diagnostics: composition.diagnostics });
    }

    const refreshResult =
      await composition.commandHandlers["sponzeySkills.refreshSkills"]();

    return (
      refreshResult.readModel ??
      emptyReadModel({ diagnostics: refreshResult.diagnostics })
    );
  };
}

function createTreeEventEmitterFactory({ vscodeApi }) {
  if (typeof vscodeApi?.EventEmitter !== "function") {
    return undefined;
  }

  return () => new vscodeApi.EventEmitter();
}

function createThemeIconFactory({ vscodeApi, extensionUri }) {
  const agentIconFiles = {
    "agent-codex": "agent-codex.svg",
    "agent-claude": "agent-claude.svg",
  };

  if (typeof vscodeApi?.Uri?.joinPath === "function" && extensionUri) {
    return (iconId) => {
      const fileName = agentIconFiles[iconId];
      if (fileName) {
        return vscodeApi.Uri.joinPath(extensionUri, "media", fileName);
      }

      if (typeof vscodeApi?.ThemeIcon === "function") {
        return new vscodeApi.ThemeIcon(iconId);
      }

      return { id: iconId };
    };
  }

  if (typeof vscodeApi?.ThemeIcon === "function") {
    return (iconId) => new vscodeApi.ThemeIcon(iconId);
  }

  return undefined;
}

function emptyReadModel({ diagnostics = [] } = {}) {
  return {
    mainRepositorySkills: [],
    globalSkills: [],
    projectSkills: [],
    diagnostics,
  };
}

async function createComposition({ runtime, vscodeApi, adapters }) {
  if (runtime.composition) {
    return runtime.composition;
  }

  const settingsReader =
    runtime.settingsReader ??
    (vscodeApi?.workspace
      ? createVsCodeSettingsReader({ workspace: vscodeApi.workspace })
      : null);

  if (!settingsReader) {
    return null;
  }

  return createExtensionComposition({
    settingsReader,
    workspaceRoots:
      runtime.workspaceRoots ??
      (vscodeApi?.workspace
        ? readVsCodeWorkspaceRoots(vscodeApi.workspace)
        : []),
    adapters,
    analyzer: runtime.analyzer,
  });
}

function createAdapters({ runtime, vscodeApi }) {
  return {
    ...defaultAdapters({ vscodeApi }),
    ...(runtime.adapters ?? {}),
  };
}

function defaultAdapters({ vscodeApi }) {
  const adapters = {
    auditStore: new FileSystemTransferAuditStore(),
  };

  if (vscodeApi?.workspace) {
    adapters.settingsWriter = createVsCodeSettingsWriter({
      workspace: vscodeApi.workspace,
      ConfigurationTarget: vscodeApi.ConfigurationTarget,
    });
  }

  if (vscodeApi?.env && vscodeApi?.Uri) {
    adapters.repositoryOpener = createVsCodeRepositoryOpener({
      env: vscodeApi.env,
      Uri: vscodeApi.Uri,
      workspace: vscodeApi.workspace,
      window: vscodeApi.window,
    });
  }

  if (vscodeApi?.window) {
    const logger = createVsCodeOutputChannelLogger({
      window: vscodeApi.window,
    });

    if (logger) {
      adapters.logger = logger;
    }
  }

  return adapters;
}

async function loadVscodeApi() {
  try {
    return await import("vscode");
  } catch {
    return null;
  }
}
