import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateExtensionManifest } from "../../scripts/extension-manifest-rules.mjs";

test("current package manifest passes extension manifest validation", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const result = await validateExtensionManifest({
    packageJson,
    async fileExists(filePath) {
      return filePath === "src/extension.js" || filePath === "media/sponzey-skills.svg";
    },
  });

  assert.deepEqual(result, {
    ok: true,
    diagnostics: [],
  });
});

test("extension manifest validation reports missing vscode engine", async () => {
  const result = await validateExtensionManifest({
    packageJson: {
      ...validPackageJson(),
      engines: {
        node: ">=22.0.0",
      },
    },
    async fileExists() {
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "manifest-missing-vscode-engine");
});

test("extension manifest validation reports missing packaging metadata", async () => {
  const packageJson = validPackageJson();
  delete packageJson.displayName;
  delete packageJson.categories;
  delete packageJson.keywords;
  delete packageJson.extensionKind;
  const result = await validateExtensionManifest({
    packageJson,
    async fileExists() {
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    [
      "manifest-display-name-missing",
      "manifest-categories-missing",
      "manifest-keywords-missing",
      "manifest-extension-kind-missing",
    ],
  );
});

test("extension manifest validation reports missing main entrypoint", async () => {
  const result = await validateExtensionManifest({
    packageJson: validPackageJson(),
    async fileExists() {
      return false;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "manifest-main-entrypoint-missing");
});

test("extension manifest validation reports missing activitybar icon", async () => {
  const packageJson = validPackageJson();
  delete packageJson.contributes.viewsContainers.activitybar[0].icon;
  const result = await validateExtensionManifest({
    packageJson,
    async fileExists() {
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "manifest-view-container-icon-missing");
});

test("extension manifest validation rejects bitmap activitybar icons", async () => {
  const packageJson = validPackageJson();
  packageJson.contributes.viewsContainers.activitybar[0].icon = "media/sponzey-skills-icon.png";
  const result = await validateExtensionManifest({
    packageJson,
    async fileExists() {
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "manifest-view-container-icon-not-svg");
});

test("extension manifest validation reports unknown menu references", async () => {
  const packageJson = validPackageJson();
  packageJson.contributes.menus["view/item/context"] = [
    {
      command: "sponzeySkills.unknownCommand",
      when: "view == sponzeySkills.unknownView && viewItem == unknownContext",
      group: "navigation@1",
    },
  ];
  const result = await validateExtensionManifest({
    packageJson,
    async fileExists() {
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    [
      "manifest-menu-command-unknown",
      "manifest-menu-view-unknown",
      "manifest-menu-view-item-unknown",
    ],
  );
});

test("extension manifest validation reports missing persisted configuration property", async () => {
  const packageJson = validPackageJson();
  delete packageJson.contributes.configuration.properties[
    "sponzeySkills.mainRepositoryPath"
  ];
  const result = await validateExtensionManifest({
    packageJson,
    async fileExists() {
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(
    result.diagnostics[0].code,
    "manifest-configuration-property-missing",
  );
  assert.equal(
    result.diagnostics[0].property,
    "sponzeySkills.mainRepositoryPath",
  );
});

test("package build script includes manifest check", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.match(packageJson.scripts.build, /check-extension-manifest\.mjs/);
});

function validPackageJson() {
  return {
    name: "sponzey-skills-manager",
    displayName: "Sponzey Skills Manager",
    version: "0.0.0",
    type: "module",
    main: "./src/extension.js",
    categories: ["Other"],
    keywords: ["agent-skills", "codex", "claude"],
    extensionKind: ["workspace"],
    engines: {
      vscode: "^1.95.0",
      node: ">=22.0.0",
    },
    contributes: {
      commands: [
        {
          command: "sponzeySkills.refreshSkills",
          title: "Sponzey Skills: Refresh Skills",
        },
        {
          command: "sponzeySkills.applySkillToGlobalTarget",
          title: "Sponzey Skills: Apply Skill to Global Target",
        },
      ],
      viewsContainers: {
        activitybar: [
          {
            id: "sponzeySkills",
            title: "Sponzey Skills",
            icon: "media/sponzey-skills.svg",
          },
        ],
      },
      views: {
        sponzeySkills: [
          {
            id: "sponzeySkills.mainRepository",
            name: "Main Repository",
          },
        ],
      },
      menus: {
        "view/item/context": [
          {
            command: "sponzeySkills.applySkillToGlobalTarget",
            when: "view == sponzeySkills.mainRepository && viewItem == sponzeySkillSource",
            group: "navigation@1",
          },
        ],
      },
      configuration: {
        title: "Sponzey Skills",
        properties: {
          "sponzeySkills.mainRepositoryPath": {
            type: "string",
            default: "",
          },
          "sponzeySkills.enabledClients": {
            type: "array",
            default: ["codex"],
          },
          "sponzeySkills.globalTargets": {
            type: "array",
            default: [],
          },
          "sponzeySkills.projectTargetPatterns": {
            type: "array",
            default: [".agents/skills"],
          },
          "sponzeySkills.defaultApplyMode": {
            type: "string",
            default: "copy",
          },
          "sponzeySkills.riskPolicy": {
            type: "object",
            default: {},
          },
          "sponzeySkills.backupPolicy": {
            type: "object",
            default: {},
          },
          "sponzeySkills.loggingPolicy": {
            type: "object",
            default: {},
          },
        },
      },
    },
  };
}
