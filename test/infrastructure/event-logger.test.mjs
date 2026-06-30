import test from "node:test";
import assert from "node:assert/strict";

import { routeLogEvents } from "../../src/application/index.js";
import { createEventLogger, maskEvent } from "../../src/infrastructure/index.js";

test("maskEvent masks sensitive values and home paths", () => {
  const masked = maskEvent({
    level: "ProductLog",
    code: "sample",
    path: `${process.env.HOME}/repo/skills/alpha`,
    token: "super-secret-token",
    skillBody: "full body",
  });

  assert.equal(masked.path.includes(process.env.HOME ?? "never"), false);
  assert.equal(masked.token, "[masked]");
  assert.equal(masked.skillBody, "[masked]");
});

test("routeLogEvents separates product, field debug, and development logs", async () => {
  const product = [];
  const field = [];
  const development = [];
  const logger = createEventLogger({
    productSink(event) {
      product.push(event);
    },
    fieldDebugSink(event) {
      field.push(event);
    },
    developmentSink(event) {
      development.push(event);
    },
    fieldDebugEnabled: false,
    developmentEnabled: false,
  });

  const result = await routeLogEvents({
    logger,
    events: [
      { level: "ProductLog", code: "product" },
      { level: "FieldDebugLog", code: "debug" },
      { level: "DevelopmentLog", code: "development" },
    ],
  });

  assert.equal(result.routedCount, 3);
  assert.deepEqual(product.map((event) => event.code), ["product"]);
  assert.deepEqual(field, []);
  assert.deepEqual(development, []);
});
