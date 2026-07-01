import test from "node:test";
import assert from "node:assert/strict";

import { createRefreshInvalidationController } from "../../src/application/index.js";

test("refresh invalidation controller debounces multiple watcher events", async () => {
  const scheduled = [];
  let refreshCount = 0;
  const events = [];
  const controller = createRefreshInvalidationController({
    delayMs: 50,
    schedule(callback, delayMs) {
      scheduled.push({ callback, delayMs });
    },
    async refresh() {
      refreshCount += 1;
    },
    fieldDebugLog(event) {
      events.push(event);
    },
  });

  controller.invalidate({ type: "change" });
  controller.invalidate({ type: "change" });

  assert.equal(scheduled.length, 1);
  assert.equal(controller.getState(), "Debouncing");
  await scheduled[0].callback();

  assert.equal(refreshCount, 1);
  assert.equal(controller.getState(), "Idle");
  assert.deepEqual(
    events.map((event) => event.code),
    [
      "watcher.event.received",
      "watcher.event.received",
      "watcher.debounce.completed",
    ],
  );
});

test("refresh invalidation controller recovers and logs when refresh throws", async () => {
  const scheduled = [];
  const productEvents = [];
  const fieldDebugEvents = [];
  let refreshCount = 0;
  const controller = createRefreshInvalidationController({
    delayMs: 50,
    schedule(callback, delayMs) {
      scheduled.push({ callback, delayMs });
    },
    async refresh() {
      refreshCount += 1;
      throw new Error("refresh failed");
    },
    productLog(event) {
      productEvents.push(event);
    },
    fieldDebugLog(event) {
      fieldDebugEvents.push(event);
    },
  });

  controller.invalidate({ type: "change" });

  assert.equal(controller.getState(), "Debouncing");
  await assert.doesNotReject(scheduled[0].callback());

  assert.equal(refreshCount, 1);
  assert.equal(controller.getState(), "Idle");
  assert.deepEqual(productEvents, [
    {
      level: "ProductLog",
      code: "watcher.refresh.failed",
      reason: "watcher-refresh-threw",
    },
  ]);
  assert.deepEqual(fieldDebugEvents.at(-1), {
    level: "FieldDebugLog",
    code: "watcher.debounce.completed",
    invalidationCount: 1,
    status: "failed",
  });

  controller.invalidate({ type: "change" });
  assert.equal(scheduled.length, 2);
});

test("refresh invalidation controller logs returned refresh failure reason", async () => {
  const scheduled = [];
  const productEvents = [];
  const controller = createRefreshInvalidationController({
    delayMs: 50,
    schedule(callback, delayMs) {
      scheduled.push({ callback, delayMs });
    },
    async refresh() {
      return {
        ok: false,
        diagnostics: [
          {
            code: "source-scan-failed",
            severity: "error",
            message: "Source scan failed.",
          },
        ],
      };
    },
    productLog(event) {
      productEvents.push(event);
    },
  });

  controller.invalidate({ type: "change" });
  await scheduled[0].callback();

  assert.equal(controller.getState(), "Idle");
  assert.deepEqual(productEvents, [
    {
      level: "ProductLog",
      code: "watcher.refresh.failed",
      reason: "source-scan-failed",
    },
  ]);
});
