import test from "node:test";
import assert from "node:assert/strict";

import { refreshSkills } from "../../src/application/refresh/refresh-skills.js";

test("refreshSkills marks main repository sources inactive before explicit apply", async () => {
  const calls = [];
  const result = await refreshSkills({
    context: {
      mainRepositoryPath: "/repo",
      globalTargets: [],
      projectTargets: [],
    },
    skillRepository: {
      async scanSourceSkills(input) {
        calls.push(["scanSourceSkills", input]);
        return {
          ok: true,
          sources: [
            source("alpha", "/repo/skills/alpha"),
            source("beta", "/repo/skills/beta"),
          ],
        };
      },
    },
    targetStore: failIfCalledTargetStore(),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [["scanSourceSkills", { repositoryPath: "/repo" }]]);
  assert.deepEqual(result.readModel.mainRepositorySkills, [
    {
      id: "alpha",
      name: "alpha",
      sourcePath: "/repo/skills/alpha",
      status: "inactive",
      appliedTargets: [],
    },
    {
      id: "beta",
      name: "beta",
      sourcePath: "/repo/skills/beta",
      status: "inactive",
      appliedTargets: [],
    },
  ]);
  assert.deepEqual(result.readModel.globalSkills, []);
  assert.deepEqual(result.readModel.projectSkills, []);
  assert.deepEqual(result.readModel.diagnostics, []);
  assert.deepEqual(result.events, [
    {
      level: "ProductLog",
      code: "skills.refresh.completed",
      sourceCount: 2,
      targetCount: 0,
      appliedSkillCount: 0,
      diagnosticCount: 0,
    },
  ]);
  assert.deepEqual(result.steps, [
    "LoadingSources",
    "LoadingTargets",
    "MatchingSources",
    "CalculatingReadModel",
    "Completed",
  ]);
});

test("refreshSkills includes backup catalog when repository exposes backup scan", async () => {
  const result = await refreshSkills({
    context: {
      mainRepositoryPath: "/repo",
      globalTargets: [],
      projectTargets: [],
    },
    skillRepository: {
      async scanSourceSkills() {
        return {
          ok: true,
          sources: [source("alpha", "/repo/skills/alpha")],
        };
      },
      async scanBackups(input) {
        assert.deepEqual(input, { repositoryPath: "/repo" });
        return {
          ok: true,
          backups: [
            {
              skillName: "alpha",
              snapshotId: "snapshot-001",
              backupPath: "/repo/backups/alpha/snapshot-001",
            },
          ],
        };
      },
    },
    targetStore: failIfCalledTargetStore(),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.readModel.backups, [
    {
      skillName: "alpha",
      snapshotId: "snapshot-001",
      backupPath: "/repo/backups/alpha/snapshot-001",
    },
  ]);
});

test("refreshSkills aggregates managed, external, and broken target read models", async () => {
  const result = await refreshSkills({
    context: {
      mainRepositoryPath: "/repo",
      globalTargets: [
        {
          id: "global:codex",
          clientType: "codex",
          scope: "global",
          targetPath: "/global",
        },
      ],
      projectTargets: [
        {
          id: "project:/workspace:.agents/skills",
          clientType: "codex",
          scope: "project",
          workspacePath: "/workspace",
          targetPath: "/workspace/.agents/skills",
        },
      ],
    },
    skillRepository: {
      async scanSourceSkills() {
        return {
          ok: true,
          sources: [
            source("alpha", "/repo/skills/alpha"),
            source("beta", "/repo/skills/beta"),
          ],
        };
      },
    },
    targetStore: {
      async scanAppliedSkills({ targetPath }) {
        if (targetPath === "/global") {
          return {
            ok: true,
            appliedSkills: [
              {
                name: "alpha",
                kind: "managed-symlink",
                targetPath: "/global/alpha",
                sourcePath: "/repo/skills/alpha",
              },
              {
                name: "beta-copy",
                kind: "managed-copy",
                targetPath: "/global/beta-copy",
                metadata: {
                  sourcePath: "/repo/skills/beta",
                  applyMode: "copy",
                },
              },
              {
                name: "external",
                kind: "external",
                targetPath: "/global/external",
              },
            ],
            diagnostics: [],
          };
        }

        return {
          ok: true,
          appliedSkills: [
            {
              name: "broken",
              kind: "broken-symlink",
              targetPath: "/workspace/.agents/skills/broken",
            },
          ],
          diagnostics: [
            {
              code: "broken-symlink",
              severity: "warning",
              riskLevel: "low",
              message: "Target skill symlink cannot be resolved.",
              skillName: "broken",
            },
          ],
        };
      },
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.readModel.mainRepositorySkills.map((skill) => [
      skill.name,
      skill.status,
      skill.appliedTargets,
    ]),
    [
      [
        "alpha",
        "applied",
        [{ targetId: "global:codex", kind: "managed-symlink" }],
      ],
      [
        "beta",
        "applied",
        [{ targetId: "global:codex", kind: "managed-copy" }],
      ],
    ],
  );
  assert.deepEqual(result.readModel.globalSkills, [
    {
      targetId: "global:codex",
      clientType: "codex",
      scope: "global",
      targetPath: "/global",
      skills: [
        {
          name: "alpha",
          kind: "managed-symlink",
          status: "managed",
          targetPath: "/global/alpha",
          sourceId: "alpha",
        },
        {
          name: "beta-copy",
          kind: "managed-copy",
          status: "managed",
          targetPath: "/global/beta-copy",
          sourceId: "beta",
        },
        {
          name: "external",
          kind: "external",
          status: "external",
          targetPath: "/global/external",
          sourceId: null,
        },
      ],
    },
  ]);
  assert.deepEqual(result.readModel.projectSkills[0].skills, [
    {
      name: "broken",
      kind: "broken-symlink",
      status: "broken",
      targetPath: "/workspace/.agents/skills/broken",
      sourceId: null,
    },
  ]);
  assert.deepEqual(result.readModel.diagnostics, [
    {
      code: "broken-symlink",
      severity: "warning",
      riskLevel: "low",
      message: "Target skill symlink cannot be resolved.",
      skillName: "broken",
      targetId: "project:/workspace:.agents/skills",
      targetPath: "/workspace/.agents/skills",
    },
  ]);
  assert.deepEqual(result.events, [
    {
      level: "FieldDebugLog",
      code: "target.scan.completed",
      targetId: "global:codex",
      scope: "global",
      appliedSkillCount: 3,
      diagnosticCount: 0,
    },
    {
      level: "FieldDebugLog",
      code: "target.scan.completed",
      targetId: "project:/workspace:.agents/skills",
      scope: "project",
      appliedSkillCount: 1,
      diagnosticCount: 1,
    },
    {
      level: "ProductLog",
      code: "skills.refresh.completed",
      sourceCount: 2,
      targetCount: 2,
      appliedSkillCount: 4,
      diagnosticCount: 1,
    },
  ]);
});

test("refreshSkills converts source scan failure into diagnostic and product event", async () => {
  const result = await refreshSkills({
    context: {
      mainRepositoryPath: "/repo",
      globalTargets: [],
      projectTargets: [],
    },
    skillRepository: {
      async scanSourceSkills() {
        return {
          ok: false,
          error: {
            code: "repository-unreadable",
            severity: "error",
            message: "Repository cannot be read.",
          },
        };
      },
    },
    targetStore: failIfCalledTargetStore(),
  });

  assert.deepEqual(result, {
    ok: false,
    readModel: null,
    diagnostics: [
      {
        code: "repository-unreadable",
        severity: "error",
        message: "Repository cannot be read.",
      },
    ],
    events: [
      {
        level: "ProductLog",
        code: "skills.refresh.failed",
        diagnosticCount: 1,
      },
    ],
    steps: ["LoadingSources", "SourceScanFailed"],
  });
});

function source(name, sourcePath) {
  return {
    id: name,
    name,
    sourcePath,
  };
}

function failIfCalledTargetStore() {
  return {
    async scanAppliedSkills() {
      throw new Error("target store must not be called");
    },
  };
}
