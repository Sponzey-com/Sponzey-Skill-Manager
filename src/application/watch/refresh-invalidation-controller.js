export function createRefreshInvalidationController({
  refresh,
  schedule = defaultSchedule,
  delayMs = 100,
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
        await refresh?.();
        state = "Idle";
        fieldDebugLog?.({
          level: "FieldDebugLog",
          code: "watcher.debounce.completed",
          invalidationCount: count,
        });
      }, delayMs);
    },
  };
}

function defaultSchedule(callback, delayMs) {
  return setTimeout(callback, delayMs);
}
