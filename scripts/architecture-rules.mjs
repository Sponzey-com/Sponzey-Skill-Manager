import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceExtensions = new Set([".js", ".mjs", ".ts"]);

const forbiddenExternalImportsByLayer = {
  domain: new Set([
    "vscode",
    "fs",
    "node:fs",
    "fs/promises",
    "node:fs/promises",
    "path",
    "node:path",
    "process",
    "node:process",
    "child_process",
    "node:child_process",
    "http",
    "node:http",
    "https",
    "node:https",
    "net",
    "node:net",
  ]),
  application: new Set([
    "vscode",
    "fs",
    "node:fs",
    "fs/promises",
    "node:fs/promises",
    "process",
    "node:process",
  ]),
  infrastructure: new Set(),
  presentation: new Set(),
};

const forbiddenRelativeRules = {
  domain: [
    ["application", "domain-forbidden-application-import"],
    ["infrastructure", "domain-forbidden-infrastructure-import"],
    ["presentation", "domain-forbidden-presentation-import"],
  ],
  application: [
    ["infrastructure", "application-forbidden-infrastructure-import"],
    ["presentation", "application-forbidden-presentation-import"],
  ],
  infrastructure: [["presentation", "infrastructure-forbidden-presentation-import"]],
  presentation: [["infrastructure", "presentation-forbidden-infrastructure-import"]],
};

export function analyzeSourceText({ layer, filePath, sourceText }) {
  const violations = [];
  const importSpecifiers = collectImportSpecifiers(sourceText);
  const forbiddenExternalImports =
    forbiddenExternalImportsByLayer[layer] ?? new Set();

  for (const specifier of importSpecifiers) {
    if (forbiddenExternalImports.has(specifier)) {
      violations.push({
        code: `${layer}-forbidden-external-import`,
        filePath,
        layer,
        specifier,
      });
      continue;
    }

    for (const [forbiddenLayer, code] of forbiddenRelativeRules[layer] ?? []) {
      if (importsLayer({ fromFilePath: filePath, specifier, forbiddenLayer })) {
        violations.push({
          code,
          filePath,
          layer,
          specifier,
        });
      }
    }
  }

  return violations;
}

export async function checkArchitecture({ rootDir = "src" } = {}) {
  const files = await collectSourceFiles(rootDir);
  const violations = [];

  for (const filePath of files) {
    const layer = layerForPath(filePath);
    if (!layer) {
      continue;
    }

    const sourceText = await readFile(filePath, "utf8");
    violations.push(...analyzeSourceText({ layer, filePath, sourceText }));
  }

  return { files, violations };
}

function collectImportSpecifiers(sourceText) {
  const specifiers = [];
  const staticImportPattern =
    /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportPattern = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of sourceText.matchAll(staticImportPattern)) {
    specifiers.push(match[1]);
  }

  for (const match of sourceText.matchAll(dynamicImportPattern)) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

async function collectSourceFiles(rootDir) {
  const files = [];

  try {
    const entries = await readdir(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(rootDir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectSourceFiles(entryPath)));
      } else if (sourceExtensions.has(path.extname(entry.name))) {
        files.push(entryPath);
      }
    }
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return files;
    }
    throw error;
  }

  return files;
}

function layerForPath(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  const match = normalized.match(/(?:^|\/)src\/([^/]+)\//);
  const layer = match?.[1];

  if (
    layer === "domain" ||
    layer === "application" ||
    layer === "infrastructure" ||
    layer === "presentation"
  ) {
    return layer;
  }

  return null;
}

function importsLayer({ fromFilePath, specifier, forbiddenLayer }) {
  if (!specifier.startsWith(".")) {
    return false;
  }

  const fromDir = path.dirname(fromFilePath);
  const resolved = path.normalize(path.join(fromDir, specifier));
  const normalized = resolved.split(path.sep).join("/");

  return (
    normalized.includes(`/src/${forbiddenLayer}/`) ||
    normalized.startsWith(`src/${forbiddenLayer}/`)
  );
}
