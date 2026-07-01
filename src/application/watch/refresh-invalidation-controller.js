export function createRefreshInvalidationController({
  refresh,
  schedule = defaultSchedule,
  delayMs = 100,
  productLog,
  fieldDebugLog,
} = {}) {
  let state = "Idle";
  let scheduled = false;
  let invalidationCount = 0;

  return {
    getState() {
      return state;
    },
    invalidate(event = {}) {
      invalidationCount += 1;
      fieldDebugLog?.({
        level: "FieldDebugLog",
        code: "watcher.event.received",
        eventType: event.type,
      });

      if (scheduled) {
        state = "Debouncing";
        return;
      }

      state = "Invalidated";
      scheduled = true;
      state = "Debouncing";
      schedule(async () => {
        scheduled = false;
        state = "Refreshing";
        const count = invalidationCount;
        invalidationCount = 0;
        let status = "completed";
        try {
          const result = await refresh?.();
          if (result?.ok === false) {
            status = "failed";
            state = "RefreshFailed";
            await productLog?.({
              level: "ProductLog",
              code: "watcher.refresh.failed",
              reason: failureReasonFromResult(result),
            });
          }
        } catch {
          status = "failed";
          state = "RefreshFailed";
          await productLog?.({
            level: "ProductLog",
            code: "watcher.refresh.failed",
            reason: "watcher-refresh-threw",
          });
        }
        state = "Idle";
        fieldDebugLog?.({
          level: "FieldDebugLog",
          code: "watcher.debounce.completed",
          invalidationCount: count,
          status,
        });
      }, delayMs);
    },
  };
}

function failureReasonFromResult(result) {
  const diagnosticCode = (result?.diagnostics ?? []).find(
    (diagnostic) => typeof diagnostic?.code === "string",
  )?.code;

  return diagnosticCode ?? "watcher-refresh-failed";
}

function defaultSchedule(callback, delayMs) {
  return setTimeout(callback, delayMs);
}
