import { evaluateDiagnosticRemediationActionTransition } from "../application/index.js";

const COMMAND_BY_SAFE_ACTION_CODE = Object.freeze({
  "open-skill-md": "sponzeySkills.openSkillMd",
  "analyze-again": "sponzeySkills.analyzeAllSkills",
  "compare-backup": "sponzeySkills.compareSkillBackup",
  "set-main-repository": "sponzeySkills.setMainRepository",
});

const SUPPORTED_ACTION_CODES = Object.freeze([
  ...Object.keys(COMMAND_BY_SAFE_ACTION_CODE),
  "apply-skill-to-target",
  "restore-backup",
  "delete-backup",
]);

export function resolveDiagnosticActionCommand({
  item,
  actionCode,
  confirmationProvided = false,
}) {
  const normalizedActionCode = textOrNull(actionCode);
  const diagnosticActions = item?.diagnosticActions ?? {};

  const transition = evaluateDiagnosticRemediationActionTransition({
    actionCode: normalizedActionCode,
    allowedActionCodes: diagnosticActions.allowedActionCodes,
    blockedActionCodes: diagnosticActions.blockedActionCodes,
    confirmationRequiredActionCodes:
      diagnosticActions.confirmationRequiredActionCodes,
    supportedActionCodes: SUPPORTED_ACTION_CODES,
    confirmationProvided,
  });

  if (!transition.ok) {
    return diagnosticActionFailure({
      code: transition.code,
      actionCode: transition.actionCode,
      message: diagnosticActionFailureMessage(transition.code),
    });
  }

  if (normalizedActionCode === "open-skill-md" && !item?.source) {
    return diagnosticActionFailure({
      code: "diagnostic-action-source-required",
      actionCode: normalizedActionCode,
      message: "Diagnostic action requires a source skill payload.",
    });
  }

  const commandId = commandIdForAction({
    actionCode: normalizedActionCode,
    item,
  });

  return {
    ok: true,
    commandId,
    input: commandInputForAction({
      actionCode: normalizedActionCode,
      item,
    }),
  };
}

function commandInputForAction({ actionCode, item }) {
  if (actionCode === "open-skill-md") {
    return {
      source: item.source,
      diagnostic: item.diagnostic,
      openKind: "skillMd",
    };
  }

  if (actionCode === "apply-skill-to-target") {
    const input = {
      source: item.source,
      diagnostic: item.diagnostic,
      confirmationProvided: true,
    };

    assignIfPresent(input, "target", item.target);
    assignIfPresent(input, "applyMode", item.applyMode);
    return input;
  }

  if (actionCode === "compare-backup") {
    const input = {
      diagnostic: item?.diagnostic,
    };

    assignIfPresent(input, "backup", item?.backup);
    assignIfPresent(
      input,
      "referencePath",
      item?.referencePath ?? item?.source?.sourcePath ?? item?.target?.targetPath,
    );
    return input;
  }

  if (actionCode === "restore-backup") {
    const input = {
      diagnostic: item?.diagnostic,
    };

    assignIfPresent(input, "backup", item?.backup);
    assignIfPresent(input, "target", item?.target);
    return input;
  }

  if (actionCode === "delete-backup") {
    const input = {
      diagnostic: item?.diagnostic,
    };

    assignIfPresent(input, "backup", item?.backup);
    return input;
  }

  return {
    diagnostic: item?.diagnostic,
  };
}

function assignIfPresent(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

function commandIdForAction({ actionCode, item }) {
  if (actionCode === "apply-skill-to-target") {
    return isProjectApplyTarget(item)
      ? "sponzeySkills.applySkillToProjectTarget"
      : "sponzeySkills.applySkillToGlobalTarget";
  }

  if (actionCode === "restore-backup") {
    return "sponzeySkills.restoreBackupToTarget";
  }

  if (actionCode === "delete-backup") {
    return "sponzeySkills.deleteBackup";
  }

  return COMMAND_BY_SAFE_ACTION_CODE[actionCode];
}

function isProjectApplyTarget(item) {
  return item?.targetScope === "project" || item?.target?.scope === "project";
}

function diagnosticActionFailure({ code, actionCode, message }) {
  return {
    ok: false,
    code,
    diagnostics: [
      {
        code,
        severity: "warning",
        category: "diagnostic-action",
        actionCode,
        message,
      },
    ],
  };
}

function diagnosticActionFailureMessage(code) {
  if (code === "diagnostic-action-code-required") {
    return "Diagnostic action code is required.";
  }
  if (code === "diagnostic-action-blocked") {
    return "Diagnostic action is blocked by the diagnostic policy.";
  }
  if (code === "diagnostic-action-not-allowed") {
    return "Diagnostic action is not allowed for this diagnostic.";
  }
  if (code === "diagnostic-action-confirmation-required") {
    return "Diagnostic action requires confirmation workflow before execution.";
  }
  return "Diagnostic action does not have a registered command yet.";
}

function textOrNull(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
