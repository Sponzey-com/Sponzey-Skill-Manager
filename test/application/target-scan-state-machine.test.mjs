import test from "node:test";
import assert from "node:assert/strict";

import { transitionTargetScan } from "../../src/application/index.js";

test("target scan state machine reaches completed and partial terminal states", () => {
  assert.deepEqual(transitionTargetScan("Idle", "Validate"), {
    ok: true,
    state: "ValidatingTarget",
  });
  assert.deepEqual(
    transitionTargetScan("ValidatingTarget", "TargetValid"),
    {
      ok: true,
      state: "ScanningTarget",
    },
  );
  assert.deepEqual(
    transitionTargetScan("ScanningTarget", "ScanCompleted"),
    {
      ok: true,
      state: "Completed",
    },
  );
  assert.deepEqual(
    transitionTargetScan("ScanningTarget", "DiagnosticsFound"),
    {
      ok: true,
      state: "CompletedWithDiagnostics",
    },
  );
  assert.deepEqual(
    transitionTargetScan("ScanningTarget", "TargetFailed"),
    {
      ok: true,
      state: "TargetUnavailable",
    },
  );
});

test("target scan state machine rejects invalid transitions", () => {
  const result = transitionTargetScan("Idle", "ScanCompleted");

  assert.equal(result.ok, false);
  assert.equal(result.state, "Idle");
  assert.equal(result.diagnostic.code, "invalid-target-scan-transition");
});
