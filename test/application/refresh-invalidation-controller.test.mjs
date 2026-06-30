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
