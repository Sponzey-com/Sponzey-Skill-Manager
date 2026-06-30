import test from "node:test";
import assert from "node:assert/strict";

import { createVsCodeOutputChannelLogger } from "../../src/infrastructure/index.js";

test("createVsCodeOutputChannelLogger writes product logs and keeps debug logs disabled by default", async () => {
  const lines = [];
  const logger = createVsCodeOutputChannelLogger({
    window: {
      createOutputChannel(name) {
        assert.equal(name, "Sponzey Skills");
        return {
          appendLine(line) {
            lines.push(line);
          },
        };
      },
    },
  });

  await logger.product({
    level: "ProductLog",
    code: "skill.apply.completed",
    token: "secret-token-value",
  });
  await logger.fieldDebug({
    level: "FieldDebugLog",
    code: "watcher.event.received",
  });
  await logger.development({
    level: "DevelopmentLog",
    code: "dev.trace",
  });

  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.level, "ProductLog");
  assert.equal(parsed.code, "skill.apply.completed");
  assert.equal(parsed.event.token, "[masked]");
});

test("createVsCodeOutputChannelLogger returns null when output channels are unavailable", () => {
  const logger = createVsCodeOutputChannelLogger({ window: {} });

  assert.equal(logger, null);
});
