import test from "node:test";
import assert from "node:assert/strict";

import {
  SPONZEY_TREE_VIEWS,
  createSkillsTreeDataProvider,
  createSkillsTreeDataProviders,
  refreshSponzeyTreeDataProviders,
  registerSponzeyTreeDataProviders,
} from "../../src/presentation/tree-data-provider.js";

test("main repository tree provider loads source skill children", async () => {
  let loadCount = 0;
  const provider = createSkillsTreeDataProvider({
    viewId: "sponzeySkills.mainRepository",
    async loadReadModel() {
      loadCount += 1;
      return sampleReadModel();
    },
  });

  const children = await provider.getChildren();
  const treeItem = provider.getTreeItem(children[0]);
  const cachedChildren = await provider.getChildren();

  assert.equal(loadCount, 1);
  assert.deepEqual(
    children.map((item) => item.label),
    ["alpha"],
  );
  assert.equal(cachedChildren, children);
  assert.deepEqual(treeItem, {
    id: "source:alpha",
    label: "alpha",
    description: "applied",
    tooltip: "/repo/skills/alpha",
    iconPath: { id: "repo" },
    contextValue: "sponzeySkillSource",
    collapsibleState: 0,
  });
});

test("tree provider converts icon ids with provided theme icon factory", async () => {
  const provider = createSkillsTreeDataProvider({
    viewId: "sponzeySkills.mainRepository",
    async loadReadModel() {
      return sampleReadModel();
    },
    themeIconFactory(iconId) {
      return {
        themeIcon: iconId,
      };
    },
  });

  const children = await provider.getChildren();
  const treeItem = provider.getTreeItem(children[0]);

  assert.deepEqual(treeItem.iconPath, {
    themeIcon: "repo",
  });
});

test("global skills tree provider returns applied skills with agent badges", async () => {
  const provider = createSkillsTreeDataProvider({
    viewId: "sponzeySkills.globalSkills",
    async loadReadModel() {
      return sampleReadModel();
    },
  });

  const skills = await provider.getChildren();

  assert.deepEqual(
    skills.map((item) => provider.getTreeItem(item)),
    [
      {
        id: "target-skill:global:codex:alpha",
        label: "alpha",
        description: "Codex · managed-copy",
        tooltip: "/global -> /target/alpha",
        iconPath: { id: "agent-codex" },
        contextValue: "sponzeyAppliedSkill",
        collapsibleState: 0,
      },
    ],
  );
});

test("tree provider refresh clears cache and fires change event", async () => {
  let loadCount = 0;
  const fired = [];
  const provider = createSkillsTreeDataProvider({
    viewId: "sponzeySkills.diagnostics",
    async loadReadModel() {
      loadCount += 1;
      return sampleReadModel();
    },
    eventEmitter: {
      event: "event-token",
      fire(element) {
        fired.push(element);
      },
    },
  });

  await provider.getChildren();
  await provider.refresh();
  await provider.getChildren();

  assert.equal(provider.onDidChangeTreeData, "event-token");
  assert.equal(loadCount, 2);
  assert.deepEqual(fired, [undefined]);
});

test("tree provider setReadModel replaces cache without calling loader again", async () => {
  let loadCount = 0;
  const fired = [];
  const provider = createSkillsTreeDataProvider({
    viewId: "sponzeySkills.mainRepository",
    async loadReadModel() {
      loadCount += 1;
      return sampleReadModel();
    },
    eventEmitter: {
      event: "event-token",
      fire(element) {
        fired.push(element);
      },
    },
  });

  const initialChildren = await provider.getChildren();
  provider.setReadModel({
    ...sampleReadModel(),
    mainRepositorySkills: [
      {
        name: "beta",
        status: "inactive",
        sourcePath: "/repo/skills/beta",
      },
    ],
  });
  const updatedChildren = await provider.getChildren();

  assert.equal(loadCount, 1);
  assert.deepEqual(
    initialChildren.map((item) => item.label),
    ["alpha"],
  );
  assert.deepEqual(
    updatedChildren.map((item) => item.label),
    ["beta"],
  );
  assert.deepEqual(fired, [undefined]);
});

test("refreshSponzeyTreeDataProviders updates all provider caches", async () => {
  const providers = createSkillsTreeDataProviders({
    async loadReadModel() {
      return sampleReadModel();
    },
  });

  refreshSponzeyTreeDataProviders({
    providers,
    readModel: {
      ...sampleReadModel(),
      diagnostics: [
        {
          code: "updated-diagnostic",
          severity: "warning",
          message: "Updated diagnostic.",
        },
      ],
    },
  });

  const diagnostics = await providers["sponzeySkills.diagnostics"].getChildren();
  const categories =
    await providers["sponzeySkills.diagnostics"].getChildren(diagnostics[0]);
  const diagnosticItems =
    await providers["sponzeySkills.diagnostics"].getChildren(categories[0]);

  assert.deepEqual(
    diagnostics.map((item) => item.label),
    ["warning"],
  );
  assert.deepEqual(
    categories.map((item) => item.label),
    ["uncategorized"],
  );
  assert.deepEqual(
    diagnosticItems.map((item) => item.label),
    ["updated-diagnostic"],
  );
});

test("registerSponzeyTreeDataProviders registers every contributed view", () => {
  const registered = [];
  const providers = createSkillsTreeDataProviders({
    async loadReadModel() {
      return sampleReadModel();
    },
  });

  const disposables = registerSponzeyTreeDataProviders({
    windowApi: {
      registerTreeDataProvider(viewId, provider) {
        registered.push([viewId, provider]);
        return { dispose() {} };
      },
    },
    providers,
  });

  assert.deepEqual(
    registered.map(([viewId]) => viewId),
    SPONZEY_TREE_VIEWS.map((view) => view.id),
  );
  assert.equal(
    registered.every(([, provider]) => typeof provider.getChildren === "function"),
    true,
  );
  assert.equal(disposables.length, SPONZEY_TREE_VIEWS.length);
});

function sampleReadModel() {
  return {
    mainRepositorySkills: [
      {
        id: "alpha",
        name: "alpha",
        status: "applied",
        sourcePath: "/repo/skills/alpha",
      },
    ],
    globalSkills: [
      {
        targetId: "global:codex",
        clientType: "codex",
        scope: "global",
        targetPath: "/global",
        skills: [
          {
            name: "alpha",
            kind: "managed-copy",
            targetPath: "/target/alpha",
            sourceId: "alpha",
          },
        ],
      },
    ],
    projectSkills: [],
    diagnostics: [
      {
        code: "broken-symlink",
        severity: "warning",
        message: "Target skill symlink cannot be resolved.",
      },
    ],
  };
}
