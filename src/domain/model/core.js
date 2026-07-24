export function createSkillName(input) {
  const value = String(input ?? "").trim();

  if (value.length === 0) {
    return {
      ok: false,
      diagnostics: [
        {
          code: "invalid-skill-name",
          severity: "error",
          message: "Skill name must not be empty.",
        },
      ],
    };
  }

  return {
    ok: true,
    value: Object.freeze({
      kind: "SkillName",
      value,
    }),
    diagnostics: [],
  };
}

export function createSkillSource({ id, name, sourcePath }) {
  return {
    ok: true,
    value: Object.freeze({
      kind: "SkillSource",
      id,
      name,
      sourcePath: normalizePath(sourcePath),
    }),
    diagnostics: [],
  };
}

const targetOrigins = new Set(["standard", "configured", "compatibility"]);

const defaultTargetCapabilities = Object.freeze({
  discoverable: true,
  applyable: true,
  removable: true,
  movable: true,
  copyable: true,
  backupable: true,
});

export function createSkillTarget({
  id,
  clientType,
  scope,
  targetPath,
  origin = "configured",
  capabilities = {},
}) {
  const normalizedCapabilities = Object.freeze({
    ...defaultTargetCapabilities,
    ...capabilities,
  });

  if (
    !targetOrigins.has(origin) ||
    (origin === "compatibility" &&
      (normalizedCapabilities.applyable ||
        normalizedCapabilities.removable ||
        normalizedCapabilities.movable))
  ) {
    return {
      ok: false,
      value: null,
      diagnostics: [
        {
          code: "invalid-target-capabilities",
          severity: "error",
          message:
            "Compatibility targets must not allow apply, remove, or move operations.",
        },
      ],
    };
  }

  return {
    ok: true,
    value: Object.freeze({
      kind: "SkillTarget",
      id,
      clientType,
      scope,
      targetPath: normalizePath(targetPath),
      origin,
      capabilities: normalizedCapabilities,
    }),
    diagnostics: [],
  };
}

export function normalizePath(value) {
  const normalized = String(value ?? "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }

  return normalized;
}
