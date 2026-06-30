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

export function createSkillTarget({ id, clientType, scope, targetPath }) {
  return {
    ok: true,
    value: Object.freeze({
      kind: "SkillTarget",
      id,
      clientType,
      scope,
      targetPath: normalizePath(targetPath),
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
