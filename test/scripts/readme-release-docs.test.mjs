import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readmePath = "README.md";

const requiredTroubleshootingSignals = Object.freeze([
  "CODE_BIN=/path/to/code",
  "~/SponzeySkills",
  "Codex",
  "Claude",
  "Diagnostics",
  "permission",
  "watcher",
  "Sponzey Skills: Refresh Skills",
  "Product Log",
  "Field Debug Log",
  "Main Repository is a source repository",
]);

const requiredDevelopmentSignals = Object.freeze([
  "npm test",
  "npm run build",
  "npm run release:gate",
  "npm run check:vsix-candidate",
  "npm run package:vsix-candidate",
  "PackagingToolMissing",
  "Release VSIX",
  "git tag",
  "git push origin",
  "GitHub Release",
  "build-only",
  "v0.1.1a",
  "scripts/run-vscode-extension-host.sh",
]);

test("README covers Phase 003 troubleshooting and release signals", async () => {
  const content = await readFile(readmePath, "utf8");

  for (const signal of requiredTroubleshootingSignals) {
    assert.match(content, new RegExp(escapeRegExp(signal), "i"));
  }

  for (const signal of requiredDevelopmentSignals) {
    assert.match(content, new RegExp(escapeRegExp(signal), "i"));
  }
});

test("README keeps Main Repository documented as source-only", async () => {
  const content = await readFile(readmePath, "utf8");

  assert.match(content, /Main Repository stores source skills only/i);
  assert.doesNotMatch(
    content,
    /Main Repository (?:is|acts as|serves as) (?:a|the) Global Target/i,
  );
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
