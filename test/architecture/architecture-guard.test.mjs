import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSourceText,
  checkArchitecture,
} from "../../scripts/architecture-rules.mjs";

test("domain source rejects framework and filesystem imports", () => {
  const violations = analyzeSourceText({
    layer: "domain",
    filePath: "src/domain/bad.js",
    sourceText: 'import fs from "node:fs";\nexport const value = 1;\n',
  });

  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "domain-forbidden-external-import");
});

test("presentation source cannot import infrastructure", () => {
  const violations = analyzeSourceText({
    layer: "presentation",
    filePath: "src/presentation/bad.js",
    sourceText:
      'import { adapter } from "../infrastructure/filesystem/adapter.js";\nexport const value = adapter;\n',
  });

  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "presentation-forbidden-infrastructure-import");
});

test("empty project source list has no architecture violations", async () => {
  const result = await checkArchitecture({ rootDir: "test/fixtures/empty-src" });

  assert.deepEqual(result.violations, []);
});
