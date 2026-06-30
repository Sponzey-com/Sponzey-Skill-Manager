import test from "node:test";
import assert from "node:assert/strict";

test("domain and application modules import without VSCode runtime", async () => {
  const domain = await import("../../src/domain/index.js");
  const application = await import("../../src/application/index.js");

  assert.equal(domain.layerName, "domain");
  assert.equal(application.layerName, "application");
});

test("extension entrypoint imports without activating VSCode APIs", async () => {
  const extension = await import("../../src/extension.js");

  assert.equal(typeof extension.activate, "function");
  assert.equal(typeof extension.deactivate, "function");
});
