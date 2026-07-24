import { createSkillTarget } from "../../domain/index.js";

const allowedApplyModes = new Set(["symlink", "copy"]);

const compatibilityCapabilities = Object.freeze({
  discoverable: true,
  applyable: false,
  removable: false,
  movable: false,
  copyable: true,
  backupable: true,
});

export async function buildRuntimeContext({
  settingsReader,
  workspaceRoots = [],
  standardGlobalTargets = [],
}) {
  const settings = await settingsReader.readSettings();
  return createRuntimeContext({
    settings,
    workspaceRoots,
    standardGlobalTargets,
  });
}

export function createRuntimeContext({
  settings,
  workspaceRoots = [],
  standardGlobalTargets = [],
}) {
  const globalTargets = buildGlobalTargets({
    configuredTargets: settings.globalTargets,
    standardGlobalTargets,
    enabledClients: settings.enabledClients,
  });
  const projectTargets = buildProjectTargets({
    workspaceRoots,
    projectTargetPatterns: settings.projectTargetPatterns,
    enabledClients: settings.enabledClients,
  });
  const diagnostics = validateSettings({
    settings,
    globalTargets,
    projectTargets,
  });

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
      globalTargets,
      projectTargetPatterns: [...settings.projectTargetPatterns],
      projectTargets,
      workspaceRoots: workspaceRoots.map(normalizePath),
      defaultApplyMode: settings.defaultApplyMode,
      riskPolicy: { ...settings.riskPolicy },
      backupPolicy: { ...settings.backupPolicy },
      loggingPolicy: { ...settings.loggingPolicy },
    }),
    diagnostics,
  };
}

function validateSettings({ settings, globalTargets, projectTargets }) {
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
    ...globalTargets.map((target) => target.targetPath),
    ...projectTargets.map((target) => target.targetPath),
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

function buildGlobalTargets({
  configuredTargets,
  standardGlobalTargets,
  enabledClients,
}) {
  const targetsByKey = new Map();

  for (const target of standardGlobalTargets) {
    if (!enabledClients.includes(target.clientType)) {
      continue;
    }

    const value = targetValue({
      ...target,
      id:
        target.id ??
        `global:${target.clientType}:${normalizePath(target.targetPath)}`,
      scope: "global",
      origin: "standard",
    });
    targetsByKey.set(targetKey(value), value);
  }

  for (const target of configuredTargets) {
    const origin =
      target.origin ?? configuredTargetOrigin(target.targetPath);
    const value = targetValue({
      ...target,
      scope: "global",
      origin,
      capabilities:
        origin === "compatibility"
          ? compatibilityCapabilities
          : target.capabilities,
    });
    targetsByKey.set(targetKey(value), value);
  }

  return [...targetsByKey.values()];
}

function buildProjectTargets({
  workspaceRoots,
  projectTargetPatterns,
  enabledClients,
}) {
  const targets = [];

  for (const workspaceRoot of workspaceRoots) {
    for (const pattern of projectTargetPatterns) {
      const clientType = clientTypeForPattern(pattern);
      if (!enabledClients.includes(clientType)) {
        continue;
      }

      const origin = configuredTargetOrigin(pattern, {
        standardPatterns: [".agents/skills", ".claude/skills"],
      });
      targets.push(
        targetValue({
          id: `project:${normalizePath(workspaceRoot)}:${pattern}`,
          clientType,
          scope: "project",
          workspacePath: normalizePath(workspaceRoot),
          targetPattern: pattern,
          targetPath: joinPath(workspaceRoot, pattern),
          origin,
          capabilities:
            origin === "compatibility"
              ? compatibilityCapabilities
              : undefined,
        }),
      );
    }
  }

  return targets;
}

function targetValue(target) {
  const result = createSkillTarget(target);
  if (!result.ok) {
    throw new TypeError(result.diagnostics[0]?.message ?? "Invalid skill target.");
  }

  return Object.freeze({
    ...result.value,
    ...(target.workspacePath
      ? { workspacePath: normalizePath(target.workspacePath) }
      : {}),
    ...(target.targetPattern ? { targetPattern: target.targetPattern } : {}),
  });
}

function targetKey(target) {
  return `${target.clientType}:${target.scope}:${target.targetPath}`;
}

function configuredTargetOrigin(targetPath, { standardPatterns = [] } = {}) {
  const normalized = normalizePath(targetPath);
  if (standardPatterns.includes(normalized)) {
    return "standard";
  }

  if (
    normalized === ".codex/skills" ||
    normalized.endsWith("/.codex/skills")
  ) {
    return "compatibility";
  }

  return "configured";
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
