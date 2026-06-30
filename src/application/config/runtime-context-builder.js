const allowedApplyModes = new Set(["symlink", "copy"]);

export async function buildRuntimeContext({ settingsReader, workspaceRoots = [] }) {
  const settings = await settingsReader.readSettings();
  return createRuntimeContext({ settings, workspaceRoots });
}

export function createRuntimeContext({ settings, workspaceRoots = [] }) {
  const diagnostics = validateSettings({ settings, workspaceRoots });

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return {
      ok: false,
      context: null,
      diagnostics,
    };
  }

  return {
    ok: true,
    context: deepFreeze({
      mainRepositoryPath: normalizePath(settings.mainRepositoryPath),
      enabledClients: [...settings.enabledClients],
      globalTargets: settings.globalTargets.map((target) => ({
        ...target,
        targetPath: normalizePath(target.targetPath),
      })),
      projectTargetPatterns: [...settings.projectTargetPatterns],
      projectTargets: buildProjectTargets({
        workspaceRoots,
        projectTargetPatterns: settings.projectTargetPatterns,
      }),
      workspaceRoots: workspaceRoots.map(normalizePath),
      defaultApplyMode: settings.defaultApplyMode,
      riskPolicy: { ...settings.riskPolicy },
      backupPolicy: { ...settings.backupPolicy },
      loggingPolicy: { ...settings.loggingPolicy },
    }),
    diagnostics,
  };
}

function validateSettings({ settings, workspaceRoots }) {
  const diagnostics = [];

  if (!allowedApplyModes.has(settings.defaultApplyMode)) {
    diagnostics.push({
      code: "invalid-default-apply-mode",
      severity: "error",
      productLogEvent: "runtime.context.validation.failed",
      fieldDebugEvent: "config.validation.detail",
      message: "Default apply mode must be symlink or copy.",
    });
  }

  const mainRepositoryPath = normalizePath(settings.mainRepositoryPath);
  const targetPaths = [
    ...settings.globalTargets.map((target) => normalizePath(target.targetPath)),
    ...buildProjectTargets({
      workspaceRoots,
      projectTargetPatterns: settings.projectTargetPatterns,
    }).map((target) => target.targetPath),
  ];

  if (hasText(mainRepositoryPath)) {
    for (const targetPath of targetPaths) {
      const relation = pathRelation(mainRepositoryPath, targetPath);
      if (relation !== "separate") {
        diagnostics.push({
          code: "main-repository-overlaps-target",
          severity: "error",
          relation,
          productLogEvent: "runtime.context.validation.failed",
          fieldDebugEvent: "config.validation.detail",
          message: "Main repository path must be separate from skill target paths.",
        });
      }
    }
  }

  return diagnostics;
}

function buildProjectTargets({ workspaceRoots, projectTargetPatterns }) {
  const targets = [];

  for (const workspaceRoot of workspaceRoots) {
    for (const pattern of projectTargetPatterns) {
      targets.push({
        id: `project:${normalizePath(workspaceRoot)}:${pattern}`,
        clientType: clientTypeForPattern(pattern),
        scope: "project",
        workspacePath: normalizePath(workspaceRoot),
        targetPattern: pattern,
        targetPath: joinPath(workspaceRoot, pattern),
      });
    }
  }

  return targets;
}

function clientTypeForPattern(pattern) {
  if (pattern.includes(".claude")) {
    return "claude";
  }

  if (pattern.includes(".agents")) {
    return "codex";
  }

  return "custom";
}

function pathRelation(leftPath, rightPath) {
  const left = normalizePath(leftPath);
  const right = normalizePath(rightPath);

  if (left === right) {
    return "equal";
  }

  if (left.startsWith(`${right}/`)) {
    return "main-inside-target";
  }

  if (right.startsWith(`${left}/`)) {
    return "target-inside-main";
  }

  return "separate";
}

function joinPath(root, relativePath) {
  const normalizedRoot = normalizePath(root);
  const normalizedRelative = normalizePath(relativePath).replace(/^\/+/, "");
  return normalizePath(`${normalizedRoot}/${normalizedRelative}`);
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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}
