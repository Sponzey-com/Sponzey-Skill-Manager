import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checklistPath = ".tasks/release-smoke.md";

const requiredSections = Object.freeze([
  "## 1. Automated Verification",
  "## 2. Extension Development Host",
  "## 3. Repository Setup",
  "## 4. Repository Index And Versioning",
  "## 5. Main Repository Skill Lifecycle",
  "## 6. Global And Project Apply",
  "## 7. Diagnostics And Analysis",
  "## 8. Backup Transfer And Safety",
  "## 9. Diagnostics Remediation Workflow",
  "## 10. Watcher Refresh And Runtime Recomposition",
  "## 11. Documentation And Release Gate",
]);

const requiredPhase004Signals = Object.freeze([
  "scripts/run-vscode-extension-host.sh",
  "Project Skills view is visible when a workspace folder is open",
  "Project Skills view is hidden in file-only VSCode windows",
  "default Main Repository",
  "Repository Index V2",
  "sourceId",
  "Local Git versioning",
  "Git URL or local path install",
  "Codex badge",
  "Claude badge",
  "Target Profile",
  "Analyze All Skills",
  "Diagnostics view",
  "Built-In Analyzer Policy Pack",
  "policy code",
  "recommendation",
  "Backup Compare",
  "Restore Backup",
  "remediation actions",
  "Open SKILL.md",
  "current VSCode window",
  "source delete and applied remove",
  "watcher refresh",
  "stale analysis",
  "displayName",
  "categories",
  "keywords",
  "extensionKind",
  "VSIX publishing is not required",
]);

test("Phase 004 release smoke checklist exists with required sections", async () => {
  const content = await readFile(checklistPath, "utf8");

  for (const section of requiredSections) {
    assert.match(content, new RegExp(escapeRegExp(section)));
  }
});

test("Phase 004 release smoke checklist covers required product signals", async () => {
  const content = await readFile(checklistPath, "utf8");

  for (const signal of requiredPhase004Signals) {
    assert.match(content, new RegExp(escapeRegExp(signal), "i"));
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
