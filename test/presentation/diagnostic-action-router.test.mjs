import test from "node:test";
import assert from "node:assert/strict";

import { resolveDiagnosticActionCommand } from "../../src/presentation/diagnostic-action-router.js";

test("resolveDiagnosticActionCommand routes safe diagnostic actions to existing commands", () => {
  const item = diagnosticItem({
    allowedActionCodes: ["open-skill-md", "analyze-again", "set-main-repository"],
  });

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "open-skill-md",
    }),
    {
      ok: true,
      commandId: "sponzeySkills.openSkillMd",
      input: {
        source: item.source,
        diagnostic: item.diagnostic,
        openKind: "skillMd",
      },
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "analyze-again",
    }),
    {
      ok: true,
      commandId: "sponzeySkills.analyzeAllSkills",
      input: {
        diagnostic: item.diagnostic,
      },
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "set-main-repository",
    }),
    {
      ok: true,
      commandId: "sponzeySkills.setMainRepository",
      input: {
        diagnostic: item.diagnostic,
      },
    },
  );
});

test("resolveDiagnosticActionCommand blocks explicitly blocked actions", () => {
  const result = resolveDiagnosticActionCommand({
    item: diagnosticItem({
      allowedActionCodes: ["open-skill-md"],
      blockedActionCodes: ["apply-skill-to-target"],
    }),
    actionCode: "apply-skill-to-target",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "diagnostic-action-blocked",
    diagnostics: [
      {
        code: "diagnostic-action-blocked",
        severity: "warning",
        category: "diagnostic-action",
        actionCode: "apply-skill-to-target",
        message: "Diagnostic action is blocked by the diagnostic policy.",
      },
    ],
  });
});

test("resolveDiagnosticActionCommand rejects not allowed and source-dependent actions", () => {
  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item: diagnosticItem({
        allowedActionCodes: ["analyze-again"],
      }),
      actionCode: "open-skill-md",
    }),
    {
      ok: false,
      code: "diagnostic-action-not-allowed",
      diagnostics: [
        {
          code: "diagnostic-action-not-allowed",
          severity: "warning",
          category: "diagnostic-action",
          actionCode: "open-skill-md",
          message: "Diagnostic action is not allowed for this diagnostic.",
        },
      ],
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item: diagnosticItem({
        source: null,
        allowedActionCodes: ["open-skill-md"],
      }),
      actionCode: "open-skill-md",
    }),
    {
      ok: false,
      code: "diagnostic-action-source-required",
      diagnostics: [
        {
          code: "diagnostic-action-source-required",
          severity: "warning",
          category: "diagnostic-action",
          actionCode: "open-skill-md",
          message: "Diagnostic action requires a source skill payload.",
        },
      ],
    },
  );
});

test("resolveDiagnosticActionCommand routes confirmed mutating actions to existing apply commands", () => {
  const item = diagnosticItem({
    allowedActionCodes: ["apply-skill-to-target"],
    confirmationRequiredActionCodes: ["apply-skill-to-target"],
  });

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "apply-skill-to-target",
      confirmationProvided: true,
    }),
    {
      ok: true,
      commandId: "sponzeySkills.applySkillToGlobalTarget",
      input: {
        source: item.source,
        diagnostic: item.diagnostic,
        confirmationProvided: true,
      },
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item: {
        ...item,
        targetScope: "project",
      },
      actionCode: "apply-skill-to-target",
      confirmationProvided: true,
    }).commandId,
    "sponzeySkills.applySkillToProjectTarget",
  );
});

test("resolveDiagnosticActionCommand routes backup compare diagnostics to compare command", () => {
  const item = diagnosticItem({
    allowedActionCodes: ["compare-backup"],
  });
  item.backup = {
    skillName: "alpha",
    snapshotId: "snapshot-001",
    backupPath: "/repo/backups/alpha/snapshot-001",
  };
  item.referencePath = "/repo/skills/alpha";

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "compare-backup",
    }),
    {
      ok: true,
      commandId: "sponzeySkills.compareSkillBackup",
      input: {
        diagnostic: item.diagnostic,
        backup: item.backup,
        referencePath: "/repo/skills/alpha",
      },
    },
  );
});

test("resolveDiagnosticActionCommand routes confirmed backup restore diagnostics to restore command", () => {
  const item = diagnosticItem({
    allowedActionCodes: ["restore-backup"],
    confirmationRequiredActionCodes: ["restore-backup"],
  });
  item.backup = {
    skillName: "alpha",
    snapshotId: "snapshot-001",
    backupPath: "/repo/backups/alpha/snapshot-001",
  };
  item.target = {
    id: "global:codex",
    clientType: "codex",
    scope: "global",
    targetPath: "/global",
  };

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "restore-backup",
    }),
    {
      ok: false,
      code: "diagnostic-action-confirmation-required",
      diagnostics: [
        {
          code: "diagnostic-action-confirmation-required",
          severity: "warning",
          category: "diagnostic-action",
          actionCode: "restore-backup",
          message:
            "Diagnostic action requires confirmation workflow before execution.",
        },
      ],
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "restore-backup",
      confirmationProvided: true,
    }),
    {
      ok: true,
      commandId: "sponzeySkills.restoreBackupToTarget",
      input: {
        diagnostic: item.diagnostic,
        backup: item.backup,
        target: item.target,
      },
    },
  );
});

test("resolveDiagnosticActionCommand routes confirmed backup delete diagnostics to delete command", () => {
  const item = diagnosticItem({
    allowedActionCodes: ["delete-backup"],
    confirmationRequiredActionCodes: ["delete-backup"],
  });
  item.backup = {
    skillName: "alpha",
    snapshotId: "snapshot-001",
    backupPath: "/repo/backups/alpha/snapshot-001",
  };

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "delete-backup",
    }),
    {
      ok: false,
      code: "diagnostic-action-confirmation-required",
      diagnostics: [
        {
          code: "diagnostic-action-confirmation-required",
          severity: "warning",
          category: "diagnostic-action",
          actionCode: "delete-backup",
          message:
            "Diagnostic action requires confirmation workflow before execution.",
        },
      ],
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item,
      actionCode: "delete-backup",
      confirmationProvided: true,
    }),
    {
      ok: true,
      commandId: "sponzeySkills.deleteBackup",
      input: {
        diagnostic: item.diagnostic,
        backup: item.backup,
      },
    },
  );
});

test("resolveDiagnosticActionCommand blocks unconfirmed mutating and unsupported actions", () => {
  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item: diagnosticItem({
        allowedActionCodes: ["apply-skill-to-target"],
        confirmationRequiredActionCodes: ["apply-skill-to-target"],
      }),
      actionCode: "apply-skill-to-target",
    }),
    {
      ok: false,
      code: "diagnostic-action-confirmation-required",
      diagnostics: [
        {
          code: "diagnostic-action-confirmation-required",
          severity: "warning",
          category: "diagnostic-action",
          actionCode: "apply-skill-to-target",
          message:
            "Diagnostic action requires confirmation workflow before execution.",
        },
      ],
    },
  );

  assert.deepEqual(
    resolveDiagnosticActionCommand({
      item: diagnosticItem({
        allowedActionCodes: ["delete-source-skill"],
      }),
      actionCode: "delete-source-skill",
    }),
    {
      ok: false,
      code: "diagnostic-action-command-unavailable",
      diagnostics: [
        {
          code: "diagnostic-action-command-unavailable",
          severity: "warning",
          category: "diagnostic-action",
          actionCode: "delete-source-skill",
          message: "Diagnostic action does not have a registered command yet.",
        },
      ],
    },
  );
});

function diagnosticItem({
  source = {
    id: "alpha",
    name: "alpha",
    sourcePath: "/repo/skills/alpha",
  },
  allowedActionCodes = [],
  blockedActionCodes = [],
  confirmationRequiredActionCodes = [],
} = {}) {
  return {
    source,
    diagnostic: {
      code: "destructive-rm-rf",
      severity: "error",
      category: "security",
      sourceId: "alpha",
    },
    diagnosticActions: {
      allowedActionCodes,
      blockedActionCodes,
      confirmationRequiredActionCodes,
      hasBlockedActions: blockedActionCodes.length > 0,
      hasMutatingAllowedActions:
        confirmationRequiredActionCodes.includes("apply-skill-to-target"),
    },
  };
}
