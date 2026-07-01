export function evaluateDiagnosticRemediationActionTransition({
  actionCode,
  allowedActionCodes = [],
  blockedActionCodes = [],
  confirmationRequiredActionCodes = [],
  supportedActionCodes = [],
  confirmationProvided = false,
} = {}) {
  const normalizedActionCode = textOrNull(actionCode) ?? "";
  const steps = ["ValidatingAction"];

  if (!normalizedActionCode) {
    return rejected({
      code: "diagnostic-action-code-required",
      actionCode: "",
      steps,
    });
  }

  steps.push("CheckingBlockedPolicy");
  if (actionCodeSet(blockedActionCodes).has(normalizedActionCode)) {
    return {
      ok: false,
      state: "Blocked",
      code: "diagnostic-action-blocked",
      actionCode: normalizedActionCode,
      steps: [...steps, "ActionBlocked"],
    };
  }

  steps.push("CheckingAllowedPolicy");
  if (!actionCodeSet(allowedActionCodes).has(normalizedActionCode)) {
    return rejected({
      code: "diagnostic-action-not-allowed",
      actionCode: normalizedActionCode,
      steps: [...steps, "ActionNotAllowed"],
    });
  }

  steps.push("CheckingSupport");
  if (!actionCodeSet(supportedActionCodes).has(normalizedActionCode)) {
    return rejected({
      code: "diagnostic-action-command-unavailable",
      actionCode: normalizedActionCode,
      steps: [...steps, "ActionUnsupported"],
    });
  }

  const requiresConfirmation = actionCodeSet(
    confirmationRequiredActionCodes,
  ).has(normalizedActionCode);

  steps.push("CheckingConfirmation");
  if (requiresConfirmation && confirmationProvided !== true) {
    return rejected({
      code: "diagnostic-action-confirmation-required",
      actionCode: normalizedActionCode,
      steps: [...steps, "ConfirmationRequired"],
    });
  }

  return {
    ok: true,
    state: "ReadyToDelegate",
    actionCode: normalizedActionCode,
    requiresConfirmation,
    steps: [
      ...steps,
      ...(requiresConfirmation ? ["ConfirmationAccepted"] : []),
      "ReadyToDelegate",
    ],
  };
}

function rejected({ code, actionCode, steps }) {
  return {
    ok: false,
    state: "Rejected",
    code,
    actionCode,
    steps,
  };
}

function actionCodeSet(values) {
  return new Set(
    (Array.isArray(values) ? values : [])
      .map(textOrNull)
      .filter((value) => value !== null),
  );
}

function textOrNull(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
