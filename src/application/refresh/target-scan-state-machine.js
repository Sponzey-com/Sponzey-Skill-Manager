const transitions = Object.freeze({
  Idle: Object.freeze({
    Validate: "ValidatingTarget",
  }),
  ValidatingTarget: Object.freeze({
    TargetValid: "ScanningTarget",
    TargetInvalid: "TargetUnavailable",
  }),
  ScanningTarget: Object.freeze({
    ScanCompleted: "Completed",
    DiagnosticsFound: "CompletedWithDiagnostics",
    TargetFailed: "TargetUnavailable",
  }),
});

export function transitionTargetScan(state, event) {
  const nextState = transitions[state]?.[event];

  if (!nextState) {
    return {
      ok: false,
      state,
      diagnostic: {
        code: "invalid-target-scan-transition",
        severity: "error",
        message: `Target scan cannot handle ${event} while in ${state}.`,
      },
    };
  }

  return {
    ok: true,
    state: nextState,
  };
}
