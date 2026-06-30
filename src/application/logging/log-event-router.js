export async function routeLogEvents({ events = [], logger }) {
  if (!logger || events.length === 0) {
    return {
      ok: true,
      routedCount: 0,
      skippedCount: events.length,
    };
  }

  let routedCount = 0;
  for (const event of events) {
    const methodName = methodNameForLevel(event.level);
    if (typeof logger[methodName] !== "function") {
      continue;
    }
    await logger[methodName](event);
    routedCount += 1;
  }

  return {
    ok: true,
    routedCount,
    skippedCount: events.length - routedCount,
  };
}

function methodNameForLevel(level) {
  if (level === "ProductLog") return "product";
  if (level === "FieldDebugLog") return "fieldDebug";
  if (level === "DevelopmentLog") return "development";
  return "development";
}
