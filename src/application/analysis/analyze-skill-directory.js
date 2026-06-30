const RISK_ORDER = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function analyzeSkillDirectory({ directoryName, files }) {
  const steps = ["LoadingSkillDirectory"];
  const skillMd = files?.["SKILL.md"];

  if (typeof skillMd !== "string") {
    return {
      manifest: {},
      body: "",
      dependencies: [],
      diagnostics: [
        {
          code: "missing-skill-md",
          category: "structure",
          severity: "critical",
          riskLevel: "critical",
          message: "Skill directory must contain SKILL.md.",
          recommendation: "Add a SKILL.md file at the root of the skill directory.",
        },
      ],
      riskLevel: "critical",
      steps: [...steps, "MissingSkillMd"],
    };
  }

  steps.push("ParsingSkillMd");
  const parsed = parseSkillMd(skillMd);
  const diagnostics = [...parsed.diagnostics];

  steps.push("RunningStructureRules");
  diagnostics.push(...runStructureRules({ directoryName, manifest: parsed.manifest }));

  steps.push("RunningDescriptionRules");
  diagnostics.push(...runDescriptionRules(parsed.manifest));
  diagnostics.push(...runReferenceRules({ body: parsed.body, files }));

  steps.push("RunningSecurityRules");
  diagnostics.push(...runSecurityRules({ body: parsed.body, manifest: parsed.manifest }));

  steps.push("RunningDependencyRules");
  const dependencies = extractDependencies({ body: parsed.body, manifest: parsed.manifest });
  diagnostics.push(...runDependencyRules({ dependencies, manifest: parsed.manifest }));

  steps.push("RunningCompatibilityRules");
  diagnostics.push(...runCompatibilityRules({ body: parsed.body, manifest: parsed.manifest }));

  steps.push("CalculatingRisk");
  const riskLevel = aggregateRiskLevel(diagnostics);

  return {
    manifest: parsed.manifest,
    body: parsed.body,
    dependencies,
    diagnostics,
    riskLevel,
    steps: [...steps, "Completed"],
  };
}

function parseSkillMd(content) {
  const lines = String(content ?? "").split(/\r?\n/);

  if (lines[0] !== "---") {
    return {
      manifest: {},
      body: String(content ?? ""),
      diagnostics: [],
    };
  }

  const endIndex = lines.indexOf("---", 1);
  if (endIndex === -1) {
    return {
      manifest: {},
      body: String(content ?? ""),
      diagnostics: [
        {
          code: "malformed-frontmatter",
          category: "structure",
          severity: "high",
          riskLevel: "high",
          message: "Skill frontmatter must have a closing delimiter.",
          recommendation: "Close the frontmatter block with --- before the skill body.",
        },
      ],
    };
  }

  const frontmatter = parseFrontmatter(lines.slice(1, endIndex));
  return {
    manifest: frontmatter.manifest,
    body: lines.slice(endIndex + 1).join("\n"),
    diagnostics: frontmatter.diagnostics,
  };
}

function parseFrontmatter(lines) {
  const manifest = {};
  const diagnostics = [];

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      diagnostics.push({
        code: "malformed-frontmatter-line",
        category: "structure",
        severity: "warning",
        riskLevel: "low",
        message: "Skill frontmatter line must use key: value format.",
        recommendation: "Rewrite invalid frontmatter lines as key: value pairs.",
      });
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key.length > 0) {
      manifest[key] = value;
    }
  }

  return {
    manifest: Object.freeze(manifest),
    diagnostics,
  };
}

function runStructureRules({ directoryName, manifest }) {
  const diagnostics = [];
  const name = String(manifest.name ?? "").trim();

  if (name.length === 0) {
    diagnostics.push({
      code: "missing-name",
      category: "structure",
      severity: "high",
      riskLevel: "high",
      message: "Skill frontmatter must include name.",
      recommendation: "Add a name field matching the skill directory name.",
    });
    return diagnostics;
  }

  if (String(directoryName ?? "").trim() !== name) {
    diagnostics.push({
      code: "skill-name-directory-mismatch",
      category: "structure",
      severity: "warning",
      riskLevel: "low",
      message: "Skill name must match the directory name.",
      recommendation: "Rename the directory or update frontmatter name so they match.",
    });
  }

  return diagnostics;
}

function runDescriptionRules(manifest) {
  const description = String(manifest.description ?? "").trim();

  if (description.length === 0) {
    return [
      {
        code: "missing-description",
        category: "quality",
        severity: "high",
        riskLevel: "high",
        message: "Skill frontmatter must include description.",
        recommendation: "Add a specific activation condition in the description field.",
      },
    ];
  }

  if (description.length < 16 || /^use this for coding\.?$/i.test(description)) {
    return [
      {
        code: "broad-description",
        category: "quality",
        severity: "warning",
        riskLevel: "low",
        message: "Skill description must identify a specific activation condition.",
        recommendation: "Describe the exact situation where this skill should be used.",
      },
    ];
  }

  return [];
}

function runReferenceRules({ body, files }) {
  const diagnostics = [];
  const referencePaths = new Set();
  const referencePattern = /\breferences\/[A-Za-z0-9._/-]+/g;

  for (const match of String(body ?? "").matchAll(referencePattern)) {
    referencePaths.add(trimReferencePath(match[0]));
  }

  for (const referencePath of referencePaths) {
    if (typeof files?.[referencePath] !== "string") {
      diagnostics.push({
        code: "missing-referenced-file",
        category: "structure",
        severity: "warning",
        riskLevel: "low",
        message: "Referenced file is missing.",
        recommendation: "Add the referenced file or remove the stale reference.",
        referencePath,
      });
    }
  }

  return diagnostics;
}

function runSecurityRules({ body, manifest }) {
  const text = String(body ?? "");
  const diagnostics = [];

  if (/\brm\s+-rf\b/i.test(text)) {
    diagnostics.push({
      code: "destructive-rm-rf",
      category: "security",
      severity: "critical",
      riskLevel: "critical",
      message: "Destructive remove command detected.",
      recommendation: "Remove destructive shell instructions or require an explicit guarded workflow.",
    });
  }

  if (/\bcurl\b[^\n|]*\|\s*(?:sh|bash)\b/i.test(text)) {
    diagnostics.push({
      code: "curl-pipe-shell",
      category: "security",
      severity: "critical",
      riskLevel: "critical",
      message: "Curl to shell pattern detected.",
      recommendation: "Replace curl-to-shell execution with explicit download, verification, and review steps.",
    });
  }

  if (/\b(?:api[_-]?key|token|secret)\b[^\n]*(?:curl|fetch|http)/i.test(text)) {
    diagnostics.push({
      code: "secret-exfiltration-pattern",
      category: "security",
      severity: "critical",
      riskLevel: "critical",
      message: "Potential secret exfiltration pattern detected.",
      recommendation: "Remove instructions that send credentials or secret-like values over the network.",
    });
  }

  if (/ignore (?:previous|all) instructions|override (?:policy|safety)|disable (?:guard|policy)/i.test(text)) {
    diagnostics.push({
      code: "policy-override-pattern",
      category: "security",
      severity: "critical",
      riskLevel: "critical",
      message: "Policy override instruction pattern detected.",
      recommendation: "Remove policy override language from the skill instructions.",
    });
  }

  const allowedTools = String(manifest["allowed-tools"] ?? manifest.allowedTools ?? "");
  if (/\*|bash|shell|terminal/i.test(allowedTools)) {
    diagnostics.push({
      code: "broad-allowed-tools",
      category: "dependency",
      severity: "medium",
      riskLevel: "medium",
      message: "Allowed tools declaration is broad.",
      recommendation: "Limit allowed tools to the smallest explicit set required by the skill.",
    });
  }

  return diagnostics;
}

function extractDependencies({ body, manifest }) {
  const text = `${Object.values(manifest ?? {}).join("\n")}\n${String(body ?? "")}`;
  const dependencies = [];

  for (const match of text.matchAll(/\bmcp(?:Server|[_ -]?server)?[:= ]+([A-Za-z0-9._/-]+)/gi)) {
    dependencies.push(dependency("mcp", match[1]));
  }

  for (const match of text.matchAll(/\b(?:curl|wget|fetch)\s+(https?:\/\/[^\s)]+)/gi)) {
    dependencies.push(dependency("network", redactUrl(match[1])));
  }

  for (const match of text.matchAll(/\b[A-Z][A-Z0-9_]{2,}\b/g)) {
    if (/(TOKEN|SECRET|KEY|HOST|URL|PATH)$/.test(match[0])) {
      dependencies.push(dependency("environment", match[0]));
    }
  }

  for (const match of text.matchAll(/\b(?:npm|pnpm|yarn|pip|uv|cargo|go)\s+[A-Za-z0-9:_./-]+/gi)) {
    dependencies.push(dependency("shell-command", match[0].split(/\s+/)[0]));
  }

  return uniqueDependencies(dependencies);
}

function runDependencyRules({ dependencies }) {
  return dependencies.length > 0
    ? [
        {
          code: "external-dependencies-detected",
          category: "dependency",
          severity: "warning",
          riskLevel: "low",
          message: "Skill declares external dependencies.",
          recommendation: "Review external dependencies before applying this skill.",
          dependencyCount: dependencies.length,
        },
      ]
    : [];
}

function runCompatibilityRules({ body, manifest }) {
  const text = `${Object.values(manifest ?? {}).join("\n")}\n${String(body ?? "")}`;
  const diagnostics = [];

  if (/claude\s+only|requires\s+claude/i.test(text)) {
    diagnostics.push({
      code: "claude-only-compatibility",
      category: "compatibility",
      severity: "warning",
      riskLevel: "low",
      message: "Skill appears to require Claude-specific behavior.",
      recommendation: "Review compatibility before applying this skill to Codex targets.",
    });
  }

  if (/codex\s+only|requires\s+codex/i.test(text)) {
    diagnostics.push({
      code: "codex-only-compatibility",
      category: "compatibility",
      severity: "warning",
      riskLevel: "low",
      message: "Skill appears to require Codex-specific behavior.",
      recommendation: "Review compatibility before applying this skill to non-Codex targets.",
    });
  }

  return diagnostics;
}

function aggregateRiskLevel(diagnostics) {
  let current = "low";

  for (const diagnostic of diagnostics) {
    const riskLevel = diagnostic.riskLevel ?? "low";
    if (RISK_ORDER[riskLevel] > RISK_ORDER[current]) {
      current = riskLevel;
    }
  }

  return current;
}

function trimReferencePath(referencePath) {
  return referencePath.replace(/[),.;:!?]+$/g, "");
}

function dependency(type, name) {
  return Object.freeze({ type, name });
}

function uniqueDependencies(dependencies) {
  const seen = new Set();
  const unique = [];

  for (const item of dependencies) {
    const key = `${item.type}:${item.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

function redactUrl(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "network-url";
  }
}
