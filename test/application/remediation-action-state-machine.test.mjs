import test from "node:test";
import assert from "node:assert/strict";

import { evaluateDiagnosticRemediationActionTransition } from "../../src/application/index.js";

test("evaluateDiagnosticRemediationActionTransition requires confirmation before mutating delegation", () => {
  assert.deepEqual(
    evaluateDiagnosticRemediationActionTransition({
      actionCode: "apply-skill-to-target",
      allowedActionCodes: ["apply-skill-to-target"],
      blockedActionCodes: [],
      confirmationRequiredActionCodes: ["apply-skill-to-target"],
      supportedActionCodes: ["apply-skill-to-target"],
      confirmationProvided: false,
    }),
    {
      ok: false,
      state: "Rejected",
      code: "diagnostic-action-confirmation-required",
      actionCode: "apply-skill-to-target",
      steps: [
        "ValidatingAction",
        "CheckingBlockedPolicy",
        "CheckingAllowedPolicy",
        "CheckingSupport",
        "CheckingConfirmation",
        "ConfirmationRequired",
      ],
    },
  );

  assert.deepEqual(
    evaluateDiagnosticRemediationActionTransition({
      actionCode: "apply-skill-to-target",
      allowedActionCodes: ["apply-skill-to-target"],
      blockedActionCodes: [],
      confirmationRequiredActionCodes: ["apply-skill-to-target"],
      supportedActionCodes: ["apply-skill-to-target"],
      confirmationProvided: true,
    }),
    {
      ok: true,
      state: "ReadyToDelegate",
      actionCode: "apply-skill-to-target",
      requiresConfirmation: true,
      steps: [
        "ValidatingAction",
        "CheckingBlockedPolicy",
        "CheckingAllowedPolicy",
        "CheckingSupport",
        "CheckingConfirmation",
        "ConfirmationAccepted",
        "ReadyToDelegate",
      ],
    },
  );
});

test("evaluateDiagnosticRemediationActionTransition blocks forbidden actions before confirmation", () => {
  assert.deepEqual(
    evaluateDiagnosticRemediationActionTransition({
      actionCode: "apply-skill-to-target",
      allowedActionCodes: ["apply-skill-to-target"],
      blockedActionCodes: ["apply-skill-to-target"],
      confirmationRequiredActionCodes: ["apply-skill-to-target"],
      supportedActionCodes: ["apply-skill-to-target"],
      confirmationProvided: true,
    }),
    {
      ok: false,
      state: "Blocked",
      code: "diagnostic-action-blocked",
      actionCode: "apply-skill-to-target",
      steps: [
        "ValidatingAction",
        "CheckingBlockedPolicy",
        "ActionBlocked",
      ],
    },
  );
});

test("evaluateDiagnosticRemediationActionTransition rejects not allowed and unsupported actions", () => {
  assert.deepEqual(
    evaluateDiagnosticRemediationActionTransition({
      actionCode: "apply-skill-to-target",
      allowedActionCodes: ["open-skill-md"],
      blockedActionCodes: [],
      confirmationRequiredActionCodes: [],
      supportedActionCodes: ["apply-skill-to-target"],
      confirmationProvided: true,
    }),
    {
      ok: false,
      state: "Rejected",
      code: "diagnostic-action-not-allowed",
      actionCode: "apply-skill-to-target",
      steps: [
        "ValidatingAction",
        "CheckingBlockedPolicy",
        "CheckingAllowedPolicy",
        "ActionNotAllowed",
      ],
    },
  );

  assert.deepEqual(
    evaluateDiagnosticRemediationActionTransition({
      actionCode: "compare-backup",
      allowedActionCodes: ["compare-backup"],
      blockedActionCodes: [],
      confirmationRequiredActionCodes: [],
      supportedActionCodes: ["open-skill-md"],
      confirmationProvided: true,
    }),
    {
      ok: false,
      state: "Rejected",
      code: "diagnostic-action-command-unavailable",
      actionCode: "compare-backup",
      steps: [
        "ValidatingAction",
        "CheckingBlockedPolicy",
        "CheckingAllowedPolicy",
        "CheckingSupport",
        "ActionUnsupported",
      ],
    },
  );
});
