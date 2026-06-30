import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeAllSkills,
  convertAppliedSkillMode,
  deleteSourceSkill,
  getSkillDetail,
  openSkillPath,
  updateAppliedCopyFromSource,
} from "../../src/application/index.js";

test("getSkillDetail returns source detail without reading external systems directly", async () => {
  const result = await getSkillDetail({
    input: {
      source: {
        id: "alpha",
        name: "alpha",
        sourcePath: "/repo/skills/alpha",
      },
    },
    skillRepository: {
      async readSourceSkillFiles({ sourcePath }) {
        assert.equal(sourcePath, "/repo/skills/alpha");
        return {
          ok: true,
          files: {
            "SKILL.md": "body",
            "references/a.md": "reference",
          },
        };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.detail.files, ["SKILL.md", "references/a.md"]);
  assert.equal(result.detail.skillMdPath, "/repo/skills/alpha/SKILL.md");
});

test("openSkillPath opens SKILL.md through opener port", async () => {
  const calls = [];
  const result = await openSkillPath({
    input: {
      openKind: "skillMd",
      source: {
        sourcePath: "/repo/skills/alpha",
      },
    },
    repositoryOpener: {
      async openPath(input) {
        calls.push(input);
        return { ok: true };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    { path: "/repo/skills/alpha/SKILL.md", openMode: "editor" },
  ]);
});

test("analyzeAllSkills summarizes analyzer output for every source", async () => {
  const result = await analyzeAllSkills({
    context: {
      mainRepositoryPath: "/repo",
    },
    skillRepository: {
      async scanSourceSkills() {
        return {
          ok: true,
          sources: [
            { id: "alpha", name: "alpha", sourcePath: "/repo/skills/alpha" },
            { id: "beta", name: "beta", sourcePath: "/repo/skills/beta" },
          ],
        };
      },
    },
    analyzer: {
      async analyzeSourceSkill({ source }) {
        return {
          riskLevel: source.id === "alpha" ? "low" : "high",
          diagnostics:
            source.id === "alpha"
              ? []
              : [{ code: "missing-description", severity: "high" }],
        };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.summaries.map((summary) => [summary.sourceId, summary.riskLevel]),
    [
      ["alpha", "low"],
      ["beta", "high"],
    ],
  );
  assert.equal(result.diagnostics[0].sourceId, "beta");
});

test("updateAppliedCopyFromSource blocks target changes without confirmation", async () => {
  const result = await updateAppliedCopyFromSource({
    input: {
      source: { id: "alpha", sourcePath: "/repo/skills/alpha" },
      appliedSkill: {
        name: "alpha",
        kind: "managed-copy",
        syncStatus: "Target Changed",
        targetPath: "/target/alpha",
      },
    },
    targetStore: {},
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "local-modification-blocked");
});

test("deleteSourceSkill blocks applied source without impact confirmation", async () => {
  let deleteCalled = false;
  const result = await deleteSourceSkill({
    context: {
      mainRepositoryPath: "/repo",
    },
    input: {
      source: {
        name: "alpha",
        appliedTargetCount: 1,
      },
      skillName: "alpha",
      confirmationProvided: true,
    },
    skillRepository: {
      async deleteSourceSkill() {
        deleteCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(deleteCalled, false);
  assert.equal(result.ok, false);
  assert.equal(
    result.diagnostics[0].code,
    "source-delete-impact-confirmation-required",
  );
});

test("convertAppliedSkillMode delegates target writes to target store", async () => {
  const calls = [];
  const result = await convertAppliedSkillMode({
    input: {
      targetMode: "copy",
      source: { id: "alpha", sourcePath: "/repo/skills/alpha" },
      appliedSkill: {
        name: "alpha",
        kind: "managed-symlink",
        targetPath: "/target/alpha",
      },
    },
    targetStore: {
      async convertSymlinkToCopy(input) {
        calls.push(input);
        return { ok: true, targetPath: input.targetPath };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    {
      sourcePath: "/repo/skills/alpha",
      targetPath: "/target/alpha",
      metadata: {
        sourceSkillId: "alpha",
        sourcePath: "/repo/skills/alpha",
        applyMode: "copy",
      },
    },
  ]);
});
