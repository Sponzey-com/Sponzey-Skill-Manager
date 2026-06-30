import test from "node:test";
import assert from "node:assert/strict";

import {
  createSkill,
  importSkillToMainRepository,
  installSkillToMainRepository,
} from "../../src/application/source/source-skill-use-cases.js";

test("createSkill creates source in main repository without touching targets", async () => {
  const calls = [];
  const result = await createSkill({
    context: { mainRepositoryPath: "/repo" },
    input: {
      name: "helper",
      description: "Use this skill when writing helper code.",
      body: "Help with focused implementation.",
    },
    skillRepository: {
      async createSourceSkill(input) {
        calls.push(["createSourceSkill", input]);
        return {
          ok: true,
          source: {
            id: "helper",
            name: "helper",
            sourcePath: "/repo/skills/helper",
          },
        };
      },
    },
  });

  assert.deepEqual(calls, [
    [
      "createSourceSkill",
      {
        repositoryPath: "/repo",
        skillName: "helper",
        description: "Use this skill when writing helper code.",
        body: "Help with focused implementation.",
      },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    source: {
      id: "helper",
      name: "helper",
      sourcePath: "/repo/skills/helper",
    },
    diagnostics: [],
    events: [
      {
        level: "ProductLog",
        code: "skill.created",
        skillName: "helper",
      },
    ],
    steps: [
      "ValidatingInput",
      "CheckingNameConflict",
      "WritingMainRepository",
      "Completed",
    ],
  });
});

test("createSkill rejects invalid name before repository write", async () => {
  let writeCalled = false;
  const result = await createSkill({
    context: { mainRepositoryPath: "/repo" },
    input: {
      name: " ",
      description: "Description",
      body: "Body",
    },
    skillRepository: {
      async createSourceSkill() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "invalid-skill-name");
  assert.deepEqual(result.events, [
    {
      level: "ProductLog",
      code: "skill.create.failed",
      diagnosticCount: 1,
    },
  ]);
  assert.deepEqual(result.steps, ["ValidatingInput", "InvalidInput"]);
});

test("createSkill rejects missing main repository before repository write", async () => {
  let writeCalled = false;
  const result = await createSkill({
    context: { mainRepositoryPath: "" },
    input: {
      name: "helper",
      description: "Description",
      body: "Body",
    },
    skillRepository: {
      async createSourceSkill() {
        writeCalled = true;
        return { ok: true };
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "invalid-main-repository-path");
  assert.deepEqual(result.steps, ["ValidatingInput", "InvalidMainRepository"]);
});

test("importSkillToMainRepository imports source and runs optional analysis only when requested", async () => {
  const calls = [];
  const result = await importSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      externalSourcePath: "/external/review",
      name: "review",
      runAnalysisAfterImport: true,
    },
    skillRepository: {
      async importSourceSkill(input) {
        calls.push(["importSourceSkill", input]);
        return {
          ok: true,
          source: {
            id: "review",
            name: "review",
            sourcePath: "/repo/skills/review",
          },
        };
      },
    },
    analyzer: {
      async analyzeImportedSkill(input) {
        calls.push(["analyzeImportedSkill", input]);
        return {
          riskLevel: "low",
          diagnostics: [],
        };
      },
    },
  });

  assert.deepEqual(calls, [
    [
      "importSourceSkill",
      {
        repositoryPath: "/repo",
        externalSourcePath: "/external/review",
        skillName: "review",
        origin: {
          type: "local-folder",
          path: "/external/review",
        },
      },
    ],
    [
      "analyzeImportedSkill",
      {
        source: {
          id: "review",
          name: "review",
          sourcePath: "/repo/skills/review",
        },
      },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    source: {
      id: "review",
      name: "review",
      sourcePath: "/repo/skills/review",
    },
    analysis: {
      riskLevel: "low",
      diagnostics: [],
    },
    diagnostics: [],
    events: [
      {
        level: "FieldDebugLog",
        code: "skill.import.analysis.completed",
        skillName: "review",
        riskLevel: "low",
        diagnosticCount: 0,
      },
      {
        level: "ProductLog",
        code: "skill.imported",
        skillName: "review",
        diagnosticCount: 0,
      },
    ],
    steps: [
      "ValidatingInput",
      "LoadingSourceFolder",
      "CheckingNameConflict",
      "WritingMainRepository",
      "WritingMetadata",
      "OptionalAnalysis",
      "Completed",
    ],
  });
});

test("importSkillToMainRepository rejects missing main repository before repository write", async () => {
  let writeCalled = false;
  const result = await importSkillToMainRepository({
    context: { mainRepositoryPath: "" },
    input: {
      externalSourcePath: "/external/review",
      name: "review",
      runAnalysisAfterImport: true,
    },
    skillRepository: {
      async importSourceSkill() {
        writeCalled = true;
        return { ok: true };
      },
    },
    analyzer: {
      async analyzeImportedSkill() {
        throw new Error("analysis must not run without main repository");
      },
    },
  });

  assert.equal(writeCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "invalid-main-repository-path");
  assert.deepEqual(result.steps, ["ValidatingInput", "InvalidMainRepository"]);
});

test("importSkillToMainRepository returns conflict without overwrite", async () => {
  const result = await importSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      externalSourcePath: "/external/review",
      name: "review",
      runAnalysisAfterImport: false,
    },
    skillRepository: {
      async importSourceSkill() {
        return {
          ok: false,
          error: {
            code: "source-name-conflict",
            severity: "error",
            message: "Source skill already exists.",
          },
        };
      },
    },
    analyzer: {
      async analyzeImportedSkill() {
        throw new Error("analysis must not run after failed import");
      },
    },
  });

  assert.deepEqual(result, {
    ok: false,
    source: null,
    analysis: null,
    diagnostics: [
      {
        code: "source-name-conflict",
        severity: "error",
        message: "Source skill already exists.",
      },
    ],
    events: [
      {
        level: "ProductLog",
        code: "skill.import.failed",
        diagnosticCount: 1,
      },
    ],
    steps: [
      "ValidatingInput",
      "LoadingSourceFolder",
      "CheckingNameConflict",
      "NameConflictBlocked",
    ],
  });
});

test("installSkillToMainRepository rejects missing main repository before resolving source", async () => {
  let resolveCalled = false;
  const result = await installSkillToMainRepository({
    context: { mainRepositoryPath: "" },
    input: {
      sourceReference: "/external/review",
      name: "review",
      runAnalysisAfterInstall: true,
    },
    skillSourceResolver: {
      async resolveInstallSource() {
        resolveCalled = true;
        return { ok: true };
      },
    },
    skillRepository: {
      async importSourceSkill() {
        throw new Error("repository write must not run without main repository");
      },
    },
    analyzer: {
      async analyzeImportedSkill() {
        throw new Error("analysis must not run without main repository");
      },
    },
  });

  assert.equal(resolveCalled, false);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "invalid-main-repository-path");
  assert.deepEqual(result.steps, ["ValidatingInput", "InvalidMainRepository"]);
});

test("installSkillToMainRepository resolves path or URL then imports into main repository", async () => {
  const calls = [];
  const result = await installSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      sourceReference: "https://github.com/acme/review-skill",
      name: "review",
      runAnalysisAfterInstall: true,
    },
    skillSourceResolver: {
      async resolveInstallSource(input) {
        calls.push(["resolveInstallSource", input]);
        return {
          ok: true,
          sourcePath: "/tmp/sponzey-install/review-skill",
          origin: {
            type: "github",
            url: "https://github.com/acme/review-skill",
            cloneUrl: "https://github.com/acme/review-skill.git",
          },
          async cleanup() {
            calls.push(["cleanup"]);
          },
        };
      },
    },
    skillRepository: {
      async importSourceSkill(input) {
        calls.push(["importSourceSkill", input]);
        return {
          ok: true,
          source: {
            id: "review",
            name: "review",
            sourcePath: "/repo/skills/review",
          },
        };
      },
    },
    analyzer: {
      async analyzeImportedSkill(input) {
        calls.push(["analyzeImportedSkill", input]);
        return {
          riskLevel: "low",
          diagnostics: [],
        };
      },
    },
  });

  assert.deepEqual(calls, [
    [
      "resolveInstallSource",
      {
        reference: "https://github.com/acme/review-skill",
      },
    ],
    [
      "importSourceSkill",
      {
        repositoryPath: "/repo",
        externalSourcePath: "/tmp/sponzey-install/review-skill",
        skillName: "review",
        origin: {
          type: "github",
          url: "https://github.com/acme/review-skill",
          cloneUrl: "https://github.com/acme/review-skill.git",
        },
      },
    ],
    ["cleanup"],
    [
      "analyzeImportedSkill",
      {
        source: {
          id: "review",
          name: "review",
          sourcePath: "/repo/skills/review",
        },
      },
    ],
  ]);
  assert.deepEqual(result, {
    ok: true,
    source: {
      id: "review",
      name: "review",
      sourcePath: "/repo/skills/review",
    },
    analysis: {
      riskLevel: "low",
      diagnostics: [],
    },
    diagnostics: [],
    events: [
      {
        level: "FieldDebugLog",
        code: "skill.install.analysis.completed",
        skillName: "review",
        riskLevel: "low",
        diagnosticCount: 0,
      },
      {
        level: "ProductLog",
        code: "skill.installed",
        skillName: "review",
        originType: "github",
        diagnosticCount: 0,
      },
    ],
    steps: [
      "ValidatingInput",
      "ResolvingInstallSource",
      "LoadingSourceFolder",
      "CheckingNameConflict",
      "WritingMainRepository",
      "WritingMetadata",
      "CleanupInstallSource",
      "OptionalAnalysis",
      "Completed",
    ],
  });
});

test("installSkillToMainRepository cleans resolved source after import conflict", async () => {
  const calls = [];
  const result = await installSkillToMainRepository({
    context: { mainRepositoryPath: "/repo" },
    input: {
      sourceReference: "/external/review",
      name: "review",
      runAnalysisAfterInstall: true,
    },
    skillSourceResolver: {
      async resolveInstallSource() {
        calls.push(["resolveInstallSource"]);
        return {
          ok: true,
          sourcePath: "/external/review",
          origin: {
            type: "local-path",
            path: "/external/review",
          },
          async cleanup() {
            calls.push(["cleanup"]);
          },
        };
      },
    },
    skillRepository: {
      async importSourceSkill() {
        calls.push(["importSourceSkill"]);
        return {
          ok: false,
          error: {
            code: "source-name-conflict",
            severity: "error",
            message: "Source skill already exists.",
          },
        };
      },
    },
    analyzer: {
      async analyzeImportedSkill() {
        throw new Error("analysis must not run after failed install");
      },
    },
  });

  assert.deepEqual(calls, [
    ["resolveInstallSource"],
    ["importSourceSkill"],
    ["cleanup"],
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "source-name-conflict");
  assert.deepEqual(result.steps, [
    "ValidatingInput",
    "ResolvingInstallSource",
    "LoadingSourceFolder",
    "CheckingNameConflict",
    "NameConflictBlocked",
    "CleanupInstallSource",
  ]);
});
