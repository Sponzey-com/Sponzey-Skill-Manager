import { refreshSkills } from "../refresh/refresh-skills.js";

export async function setMainRepository({ input, settingsWriter, skillRepository }) {
  const steps = ["ValidatingInput"];
  const mainRepositoryPath = input?.mainRepositoryPath;

  if (!hasText(mainRepositoryPath)) {
    return failed({
      diagnostics: [
        {
          code: "invalid-main-repository-path",
          severity: "error",
          message:
            "Main repository path is required. Select a local folder for the Main Repository before installing skills from Git.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.set.failed",
          reason: "invalid-main-repository-path",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  const riskyPathDiagnostic = riskyMainRepositoryPathDiagnostic(mainRepositoryPath);
  if (riskyPathDiagnostic) {
    return failed({
      diagnostics: [riskyPathDiagnostic],
      events: [
        {
          level: "ProductLog",
          code: "repository.setup.failed",
          reason: riskyPathDiagnostic.code,
        },
        {
          level: "FieldDebugLog",
          code: "repository.validation.detail",
          pathKind: riskyPathDiagnostic.pathKind,
        },
      ],
      steps: [...steps, "PathRejected"],
    });
  }

  if (typeof settingsWriter?.updateMainRepositoryPath !== "function") {
    return failed({
      diagnostics: [
        {
          code: "settings-writer-unavailable",
          severity: "error",
          message: "Settings writer is unavailable.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.set.failed",
          reason: "settings-writer-unavailable",
        },
      ],
      steps: [...steps, "SettingsWriterUnavailable"],
    });
  }

  if (typeof skillRepository?.initializeRepository === "function") {
    steps.push("InitializingRepository");
    const initializeResult = await skillRepository.initializeRepository({
      repositoryPath: mainRepositoryPath,
    });

    if (!initializeResult.ok) {
      return failed({
        diagnostics: [initializeResult.error],
        events: [
          {
            level: "ProductLog",
            code: "repository.setup.failed",
            reason: initializeResult.error?.code,
          },
        ],
        steps: [...steps, "InitializationFailed"],
      });
    }
  }

  steps.push("WritingSettings");
  const writeResult = await settingsWriter.updateMainRepositoryPath({
    mainRepositoryPath,
  });

  if (!writeResult.ok) {
    return failed({
      diagnostics: [writeResult.error],
      events: [
        {
          level: "ProductLog",
          code: "repository.setup.failed",
          reason: writeResult.error?.code,
        },
      ],
      steps: [...steps, "WriteFailed"],
    });
  }

  return {
    ok: true,
    mainRepositoryPath: writeResult.mainRepositoryPath ?? mainRepositoryPath,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "repository.setup.completed",
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function removeMainRepository({ input, settingsWriter }) {
  const steps = ["CheckingConfirmation"];

  if (input?.confirmationProvided !== true) {
    return failed({
      diagnostics: [
        {
          code: "main-repository-remove-confirmation-required",
          severity: "error",
          message: "Removing the main repository setting requires confirmation.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.remove.blocked",
          reason: "confirmation-required",
        },
      ],
      steps: [...steps, "ConfirmationRequired"],
    });
  }

  const writerResult = requireSettingsWriter({
    settingsWriter,
    methodName: "clearMainRepositoryPath",
    eventPrefix: "mainRepository.remove",
    steps,
  });

  if (!writerResult.ok) {
    return writerResult.result;
  }

  steps.push("WritingSettings");
  const writeResult = await settingsWriter.clearMainRepositoryPath();

  if (!writeResult.ok) {
    return failed({
      diagnostics: [writeResult.error],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.remove.failed",
          reason: writeResult.error?.code,
        },
      ],
      steps: [...steps, "WriteFailed"],
    });
  }

  return {
    ok: true,
    mainRepositoryPath: writeResult.mainRepositoryPath ?? "",
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "mainRepository.remove.completed",
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function addGlobalRepository({ input, settingsWriter }) {
  const steps = ["ValidatingInput"];
  const targets = globalRepositoryInputs(input);

  if (
    targets.length === 0 ||
    targets.some(
      (target) => !hasText(target.targetPath) || !hasText(target.clientType),
    )
  ) {
    return failed({
      diagnostics: [
        {
          code: "invalid-global-repository-input",
          severity: "error",
          message: "Global repository target path and client type are required.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "globalRepository.add.failed",
          reason: "invalid-global-repository-input",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  const methodName =
    targets.length > 1 && typeof settingsWriter?.addGlobalTargets === "function"
      ? "addGlobalTargets"
      : "addGlobalTarget";
  const writerResult = requireSettingsWriter({
    settingsWriter,
    methodName,
    eventPrefix: "globalRepository.add",
    steps,
  });

  if (!writerResult.ok) {
    return writerResult.result;
  }

  steps.push("WritingSettings");
  const writeResult = await writeGlobalRepositoryTargets({
    settingsWriter,
    targets,
  });

  if (!writeResult.ok) {
    return failed({
      diagnostics: [writeResult.error],
      events: [
        {
          level: "ProductLog",
          code: "globalRepository.add.failed",
          reason: writeResult.error?.code,
        },
      ],
      steps: [...steps, "WriteFailed"],
    });
  }

  return {
    ok: true,
    target: writeResult.target ?? writeResult.targets?.[0],
    targets: writeResult.targets ?? [writeResult.target].filter(Boolean),
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "globalRepository.add.completed",
        targetCount: targets.length,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function removeGlobalRepository({ input, settingsWriter }) {
  const steps = ["ValidatingInput"];
  const targetId = input?.targetId;

  if (!hasText(targetId)) {
    return failed({
      diagnostics: [
        {
          code: "invalid-global-repository-target",
          severity: "error",
          message: "Global repository target id is required.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "globalRepository.remove.failed",
          reason: "invalid-global-repository-target",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  const writerResult = requireSettingsWriter({
    settingsWriter,
    methodName: "removeGlobalTarget",
    eventPrefix: "globalRepository.remove",
    steps,
  });

  if (!writerResult.ok) {
    return writerResult.result;
  }

  steps.push("WritingSettings");
  const writeResult = await settingsWriter.removeGlobalTarget({ targetId });

  if (!writeResult.ok) {
    return failed({
      diagnostics: [writeResult.error],
      events: [
        {
          level: "ProductLog",
          code: "globalRepository.remove.failed",
          reason: writeResult.error?.code,
        },
      ],
      steps: [...steps, "WriteFailed"],
    });
  }

  return {
    ok: true,
    removedTargetId: writeResult.removedTargetId ?? targetId,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "globalRepository.remove.completed",
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function addProjectRepository({ input, settingsWriter }) {
  const steps = ["ValidatingInput"];
  const targetPatterns = projectRepositoryPatterns(input);

  if (
    targetPatterns.length === 0 ||
    targetPatterns.some((targetPattern) => !hasText(targetPattern))
  ) {
    return failed({
      diagnostics: [
        {
          code: "invalid-project-repository-pattern",
          severity: "error",
          message: "Project repository relative path is required.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "projectRepository.add.failed",
          reason: "invalid-project-repository-pattern",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  const methodName =
    targetPatterns.length > 1 &&
    typeof settingsWriter?.addProjectTargetPatterns === "function"
      ? "addProjectTargetPatterns"
      : "addProjectTargetPattern";
  const writerResult = requireSettingsWriter({
    settingsWriter,
    methodName,
    eventPrefix: "projectRepository.add",
    steps,
  });

  if (!writerResult.ok) {
    return writerResult.result;
  }

  steps.push("WritingSettings");
  const writeResult = await writeProjectRepositoryPatterns({
    settingsWriter,
    targetPatterns,
  });

  if (!writeResult.ok) {
    return failed({
      diagnostics: [writeResult.error],
      events: [
        {
          level: "ProductLog",
          code: "projectRepository.add.failed",
          reason: writeResult.error?.code,
        },
      ],
      steps: [...steps, "WriteFailed"],
    });
  }

  return {
    ok: true,
    targetPattern: writeResult.targetPattern ?? writeResult.targetPatterns?.[0],
    targetPatterns:
      writeResult.targetPatterns ??
      [writeResult.targetPattern].filter((targetPattern) =>
        hasText(targetPattern),
      ),
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "projectRepository.add.completed",
        targetPatternCount: targetPatterns.length,
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function removeProjectRepository({ input, settingsWriter }) {
  const steps = ["ValidatingInput"];
  const targetPattern = input?.targetPattern;

  if (!hasText(targetPattern)) {
    return failed({
      diagnostics: [
        {
          code: "invalid-project-repository-pattern",
          severity: "error",
          message: "Project repository relative path is required.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "projectRepository.remove.failed",
          reason: "invalid-project-repository-pattern",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  const writerResult = requireSettingsWriter({
    settingsWriter,
    methodName: "removeProjectTargetPattern",
    eventPrefix: "projectRepository.remove",
    steps,
  });

  if (!writerResult.ok) {
    return writerResult.result;
  }

  steps.push("WritingSettings");
  const writeResult = await settingsWriter.removeProjectTargetPattern({
    targetPattern,
  });

  if (!writeResult.ok) {
    return failed({
      diagnostics: [writeResult.error],
      events: [
        {
          level: "ProductLog",
          code: "projectRepository.remove.failed",
          reason: writeResult.error?.code,
        },
      ],
      steps: [...steps, "WriteFailed"],
    });
  }

  return {
    ok: true,
    removedTargetPattern: writeResult.removedTargetPattern ?? targetPattern,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "projectRepository.remove.completed",
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function createRepositorySnapshot({
  context,
  input,
  versionControlPort,
}) {
  const steps = ["ValidatingInput"];
  const message = String(input?.message ?? "").trim();

  if (!hasText(message)) {
    return failed({
      diagnostics: [
        {
          code: "repository-snapshot-message-required",
          severity: "error",
          category: "version-control",
          message: "Repository snapshot requires an explicit commit message.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "repository.version.snapshot.failed",
          reason: "repository-snapshot-message-required",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  if (!hasText(context?.mainRepositoryPath)) {
    return failed({
      diagnostics: [
        {
          code: "invalid-main-repository-path",
          severity: "error",
          category: "repository",
          message: "Main repository path is required.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "repository.version.snapshot.failed",
          reason: "invalid-main-repository-path",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  steps.push("CheckingVersionPort");
  if (typeof versionControlPort?.createSnapshot !== "function") {
    return failed({
      diagnostics: [
        {
          code: "version-control-port-unavailable",
          severity: "warning",
          category: "version-control",
          message: "Version control is unavailable for this Main Repository.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "repository.version.snapshot.failed",
          reason: "version-control-port-unavailable",
        },
      ],
      steps: [...steps, "VersionPortUnavailable"],
    });
  }

  const paths = normalizeSnapshotPaths(input?.paths);
  steps.push("CreatingSnapshot");
  const result = await versionControlPort.createSnapshot({
    repositoryPath: context.mainRepositoryPath,
    message,
    paths,
  });

  if (!result.ok) {
    return failed({
      diagnostics: [result.error],
      events: [
        {
          level: "ProductLog",
          code: "repository.version.snapshot.failed",
          reason: result.error?.code,
        },
      ],
      steps: [...steps, "SnapshotFailed"],
    });
  }

  return {
    ok: true,
    commitHash: result.commitHash,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "repository.version.snapshot.created",
        includedPathCount: paths.length,
        commitHashPresent: hasText(result.commitHash),
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function openMainRepository({ context, repositoryOpener }) {
  const steps = ["OpeningMainRepository"];
  const path = context?.mainRepositoryPath;

  if (!hasText(path)) {
    return failed({
      diagnostics: [
        {
          code: "invalid-main-repository-path",
          severity: "error",
          message: "Main repository path is required.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.open.failed",
          reason: "invalid-main-repository-path",
        },
      ],
      steps: [...steps, "ValidationFailed"],
    });
  }

  if (typeof repositoryOpener?.openPath !== "function") {
    return failed({
      diagnostics: [
        {
          code: "repository-opener-unavailable",
          severity: "error",
          message: "Repository opener is unavailable.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.open.failed",
          reason: "repository-opener-unavailable",
        },
      ],
      steps: [...steps, "RepositoryOpenerUnavailable"],
    });
  }

  const openResult = await repositoryOpener.openPath({ path });

  if (!openResult.ok) {
    return failed({
      diagnostics: [openResult.error],
      events: [
        {
          level: "ProductLog",
          code: "mainRepository.open.failed",
          reason: openResult.error?.code,
        },
      ],
      steps: [...steps, "OpenFailed"],
    });
  }

  return {
    ok: true,
    openedPath: path,
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "mainRepository.open.completed",
      },
    ],
    steps: [...steps, "Completed"],
  };
}

export async function showDiagnostics({
  context,
  skillRepository,
  targetStore,
  repositoryIndexStore = null,
  versionControlPort = null,
}) {
  const refreshResult = await refreshSkills({
    context,
    skillRepository,
    targetStore,
    repositoryIndexStore,
    versionControlPort,
  });

  if (!refreshResult.ok) {
    return refreshResult;
  }

  const diagnostics = refreshResult.readModel.diagnostics ?? [];

  return {
    ok: true,
    diagnostics,
    readModel: refreshResult.readModel,
    events: [
      {
        level: "ProductLog",
        code: "diagnostics.show.completed",
        diagnosticCount: diagnostics.length,
      },
    ],
    steps: [...refreshResult.steps, "DiagnosticsRendered"],
  };
}

function failed({ diagnostics, events, steps }) {
  return {
    ok: false,
    diagnostics,
    events,
    steps,
  };
}

function normalizeSnapshotPaths(paths) {
  if (!Array.isArray(paths)) {
    return [];
  }

  return paths
    .map((path) => String(path ?? "").trim())
    .filter((path) => path.length > 0);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function globalRepositoryInputs(input) {
  if (Array.isArray(input?.targets)) {
    return input.targets.map((target) => ({
      targetPath: target?.targetPath,
      clientType: target?.clientType,
    }));
  }

  return [
    {
      targetPath: input?.targetPath,
      clientType: input?.clientType,
    },
  ];
}

async function writeGlobalRepositoryTargets({ settingsWriter, targets }) {
  if (
    targets.length > 1 &&
    typeof settingsWriter?.addGlobalTargets === "function"
  ) {
    return settingsWriter.addGlobalTargets({ targets });
  }

  const writtenTargets = [];
  for (const target of targets) {
    const result = await settingsWriter.addGlobalTarget(target);

    if (!result.ok) {
      return result;
    }

    writtenTargets.push(result.target);
  }

  return {
    ok: true,
    target: writtenTargets[0],
    targets: writtenTargets,
  };
}

function projectRepositoryPatterns(input) {
  if (Array.isArray(input?.targetPatterns)) {
    return input.targetPatterns;
  }

  return [input?.targetPattern];
}

async function writeProjectRepositoryPatterns({ settingsWriter, targetPatterns }) {
  if (
    targetPatterns.length > 1 &&
    typeof settingsWriter?.addProjectTargetPatterns === "function"
  ) {
    return settingsWriter.addProjectTargetPatterns({ targetPatterns });
  }

  const writtenPatterns = [];
  for (const targetPattern of targetPatterns) {
    const result = await settingsWriter.addProjectTargetPattern({
      targetPattern,
    });

    if (!result.ok) {
      return result;
    }

    writtenPatterns.push(result.targetPattern);
  }

  return {
    ok: true,
    targetPattern: writtenPatterns[0],
    targetPatterns: writtenPatterns,
  };
}

function riskyMainRepositoryPathDiagnostic(pathInput) {
  const normalizedPath = String(pathInput ?? "").replaceAll("\\", "/").toLowerCase();
  const riskyTargets = [
    ["/.agents/skills", "codex-global-target"],
    ["/.claude/skills", "claude-global-target"],
  ];

  for (const [suffix, pathKind] of riskyTargets) {
    if (normalizedPath.endsWith(suffix) || normalizedPath.includes(`${suffix}/`)) {
      return {
        code: "main-repository-path-target-like",
        severity: "error",
        pathKind,
        message: "Main repository path must not be an agent global skill target.",
      };
    }
  }

  return null;
}

function requireSettingsWriter({ settingsWriter, methodName, eventPrefix, steps }) {
  if (typeof settingsWriter?.[methodName] === "function") {
    return { ok: true };
  }

  return {
    ok: false,
    result: failed({
      diagnostics: [
        {
          code: "settings-writer-unavailable",
          severity: "error",
          message: "Settings writer is unavailable.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: `${eventPrefix}.failed`,
          reason: "settings-writer-unavailable",
        },
      ],
      steps: [...steps, "SettingsWriterUnavailable"],
    }),
  };
}
