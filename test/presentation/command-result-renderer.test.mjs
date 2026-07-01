import test from "node:test";
import assert from "node:assert/strict";

import {
  renderCommandResult,
  wrapCommandHandlerWithResultRendering,
} from "../../src/presentation/command-result-renderer.js";

test("renderCommandResult shows information message for successful result", async () => {
  const calls = [];
  const renderResult = await renderCommandResult({
    result: {
      ok: true,
      events: [{ level: "ProductLog", code: "skill.created" }],
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [["info", "Sponzey Skills: skill.created"]]);
  assert.deepEqual(renderResult, {
    shown: true,
    level: "info",
    message: "Sponzey Skills: skill.created",
  });
});

test("renderCommandResult shows detail-specific next action messages without paths", async () => {
  const calls = [];

  await renderCommandResult({
    result: {
      ok: true,
      detail: {
        type: "source",
        name: "alpha",
        sourcePath: "/secret/main/skills/alpha",
      },
    },
    window: fakeWindow(calls),
  });
  await renderCommandResult({
    result: {
      ok: true,
      detail: {
        type: "applied",
        name: "alpha",
        targetPath: "/secret/target/alpha",
      },
    },
    window: fakeWindow(calls),
  });
  await renderCommandResult({
    result: {
      ok: true,
      detail: {
        type: "backup",
        skillName: "alpha",
        snapshotId: "snapshot-001",
        backupPath: "/secret/backups/alpha/snapshot-001",
      },
    },
    window: fakeWindow(calls),
  });
  await renderCommandResult({
    result: {
      ok: true,
      detail: {
        type: "diagnostic",
        code: "external-dependencies-detected",
        severity: "warning",
        message: "Skill declares external dependencies.",
        recommendation: "Review dependency installation steps before applying.",
      },
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [
    [
      "info",
      "Sponzey Skills: skill.detail.ready - alpha source detail. Use Open SKILL.md to inspect files.",
    ],
    [
      "info",
      "Sponzey Skills: skill.detail.ready - alpha applied detail. Use Open Target Folder to inspect installed files.",
    ],
    [
      "info",
      "Sponzey Skills: skill.detail.ready - alpha backup snapshot-001. Use Promote Backup or Delete Backup from context menu.",
    ],
    [
      "warning",
      "Sponzey Skills: skill.detail.ready - external-dependencies-detected diagnostic. Review recommendation before applying.",
    ],
  ]);
  assert.equal(calls.some(([, message]) => message.includes("/secret")), false);
});

test("renderCommandResult explains Codex refresh after global skill apply", async () => {
  const calls = [];
  const renderResult = await renderCommandResult({
    result: {
      ok: true,
      applied: {
        skillName: "gh-fix-ci",
        targetId: "global:codex:/Users/example/.agents/skills",
        applyMode: "symlink",
        targetPath: "/Users/example/.agents/skills/gh-fix-ci",
      },
      events: [{ level: "ProductLog", code: "skill.apply.completed" }],
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [
    [
      "info",
      "Sponzey Skills: skill.apply.completed - Restart Codex or start a new Codex session if the skill is not visible.",
    ],
  ]);
  assert.deepEqual(renderResult, {
    shown: true,
    level: "info",
    message:
      "Sponzey Skills: skill.apply.completed - Restart Codex or start a new Codex session if the skill is not visible.",
  });
});

test("renderCommandResult summarizes analysis diagnostics instead of showing first diagnostic code", async () => {
  const calls = [];
  const renderResult = await renderCommandResult({
    result: {
      ok: true,
      diagnostics: [
        {
          code: "external-dependencies-detected",
          severity: "warning",
          message: "Skill declares external dependencies.",
        },
      ],
      events: [
        {
          level: "ProductLog",
          code: "skill.analysis.completed",
          skillCount: 2,
          diagnosticCount: 1,
        },
      ],
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [
    [
      "warning",
      "Sponzey Skills: skill.analysis.completed - 2 skills analyzed, 1 diagnostic found. Check Diagnostics for details.",
    ],
  ]);
  assert.deepEqual(renderResult, {
    shown: true,
    level: "warning",
    message:
      "Sponzey Skills: skill.analysis.completed - 2 skills analyzed, 1 diagnostic found. Check Diagnostics for details.",
  });
});

test("renderCommandResult shows warning message for warning diagnostic", async () => {
  const calls = [];
  await renderCommandResult({
    result: {
      ok: true,
      diagnostics: [
        {
          code: "broken-symlink",
          severity: "warning",
          message: "Target skill symlink cannot be resolved.",
        },
      ],
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [
    [
      "warning",
      "Sponzey Skills: broken-symlink - Target skill symlink cannot be resolved.",
    ],
  ]);
});

test("renderCommandResult shows error message for failed result", async () => {
  const calls = [];
  await renderCommandResult({
    result: {
      ok: false,
      diagnostics: [
        {
          code: "critical-risk-blocked",
          severity: "critical",
          message: "Critical risk skills must be blocked before target write.",
        },
      ],
      events: [
        {
          level: "FieldDebugLog",
          code: "analysis.rule.completed",
          skillBody: "must not render",
        },
      ],
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [
    [
      "error",
      "Sponzey Skills: critical-risk-blocked - Critical risk skills must be blocked before target write.",
    ],
  ]);
});

test("renderCommandResult shows failed result code when diagnostics are unavailable", async () => {
  const calls = [];
  await renderCommandResult({
    result: {
      ok: false,
      code: "command-handler-not-wired",
      commandId: "sponzeySkills.refreshSkills",
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, [
    ["error", "Sponzey Skills: command-handler-not-wired"],
  ]);
});

test("wrapCommandHandlerWithResultRendering returns handler result and renders it", async () => {
  const calls = [];
  const handler = wrapCommandHandlerWithResultRendering({
    async handler(input) {
      return {
        ok: true,
        input,
        events: [{ level: "ProductLog", code: "skills.refresh.completed" }],
      };
    },
    window: fakeWindow(calls),
  });

  const result = await handler({ force: true });

  assert.equal(result.ok, true);
  assert.deepEqual(result.input, { force: true });
  assert.deepEqual(calls, [
    ["info", "Sponzey Skills: skills.refresh.completed"],
  ]);
});

test("renderCommandResult does not show notification for cancelled result", async () => {
  const calls = [];
  const renderResult = await renderCommandResult({
    result: {
      ok: false,
      cancelled: true,
      diagnostics: [
        {
          code: "command-input-cancelled",
          severity: "warning",
          message: "Command input was cancelled.",
        },
      ],
      events: [{ level: "ProductLog", code: "command.input.cancelled" }],
    },
    window: fakeWindow(calls),
  });

  assert.deepEqual(calls, []);
  assert.deepEqual(renderResult, {
    shown: false,
    level: "none",
    message: "",
  });
});

test("wrapCommandHandlerWithResultRendering returns cancelled result without rendering", async () => {
  const calls = [];
  const cancelledResult = {
    ok: false,
    cancelled: true,
    diagnostics: [
      {
        code: "command-input-cancelled",
        severity: "warning",
        message: "Command input was cancelled.",
      },
    ],
  };
  const handler = wrapCommandHandlerWithResultRendering({
    async handler() {
      return cancelledResult;
    },
    window: fakeWindow(calls),
  });

  const result = await handler();

  assert.equal(result, cancelledResult);
  assert.deepEqual(calls, []);
});

function fakeWindow(calls) {
  return {
    async showInformationMessage(message) {
      calls.push(["info", message]);
    },
    async showWarningMessage(message) {
      calls.push(["warning", message]);
    },
    async showErrorMessage(message) {
      calls.push(["error", message]);
    },
  };
}
