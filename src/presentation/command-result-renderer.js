const DEFAULT_PREFIX = "Sponzey Skills";
const ERROR_SEVERITIES = new Set(["error", "critical"]);

export async function renderCommandResult({
  result,
  window,
  prefix = DEFAULT_PREFIX,
}) {
  if (result?.cancelled === true) {
    return {
      shown: false,
      level: "none",
      message: "",
    };
  }

  const rendering = createCommandResultRendering({ result, prefix });

  if (!window) {
    return {
      shown: false,
      level: rendering.level,
      message: rendering.message,
    };
  }

  await showMessage({ window, rendering });

  return {
    shown: true,
    level: rendering.level,
    message: rendering.message,
  };
}

export function wrapCommandHandlerWithResultRendering({ handler, window }) {
  return async (input) => {
    const result = await handler(input);
    await renderCommandResult({ result, window });
    return result;
  };
}

function createCommandResultRendering({ result, prefix }) {
  const diagnostic = selectDiagnostic(result?.diagnostics);
  const event = selectProductEvent(result?.events);
  if (isAnalysisCompletedEvent(event)) {
    return {
      level: selectAnalysisRenderLevel(result?.diagnostics),
      message: createAnalysisCompletedMessage({ prefix, event }),
    };
  }

  const message = createMessage({ prefix, result, diagnostic, event });
  const level = selectRenderLevel({ result, diagnostic });

  return { level, message };
}

function selectDiagnostic(diagnostics) {
  if (!Array.isArray(diagnostics)) {
    return null;
  }

  return diagnostics.find((diagnostic) => diagnostic?.code) ?? null;
}

function selectProductEvent(events) {
  if (!Array.isArray(events)) {
    return null;
  }

  return (
    events.find(
      (event) => event?.level === "ProductLog" && typeof event.code === "string",
    ) ?? null
  );
}

function createMessage({ prefix, result, diagnostic, event }) {
  if (diagnostic) {
    const diagnosticMessage =
      typeof diagnostic.message === "string" && diagnostic.message.length > 0
        ? ` - ${diagnostic.message}`
        : "";
    return `${prefix}: ${diagnostic.code}${diagnosticMessage}`;
  }

  if (event) {
    if (isCodexGlobalApplyResult({ result, event })) {
      return `${prefix}: ${event.code} - Restart Codex or start a new Codex session if the skill is not visible.`;
    }

    return `${prefix}: ${event.code}`;
  }

  if (result?.ok === false && typeof result.code === "string") {
    return `${prefix}: ${result.code}`;
  }

  if (result?.ok === false) {
    return `${prefix}: command failed`;
  }

  return `${prefix}: command completed`;
}

function createAnalysisCompletedMessage({ prefix, event }) {
  const skillCount = numberOrZero(event?.skillCount);
  const diagnosticCount = numberOrZero(event?.diagnosticCount);

  if (diagnosticCount === 0) {
    return `${prefix}: ${event.code} - ${skillCount} ${pluralize(skillCount, "skill")} analyzed, no diagnostics found.`;
  }

  return `${prefix}: ${event.code} - ${skillCount} ${pluralize(skillCount, "skill")} analyzed, ${diagnosticCount} ${pluralize(diagnosticCount, "diagnostic")} found. Check Diagnostics for details.`;
}

function isCodexGlobalApplyResult({ result, event }) {
  return (
    event?.code === "skill.apply.completed" &&
    typeof result?.applied?.targetId === "string" &&
    result.applied.targetId.startsWith("global:codex")
  );
}

function isAnalysisCompletedEvent(event) {
  return event?.code === "skill.analysis.completed";
}

function selectRenderLevel({ result, diagnostic }) {
  if (result?.ok === false || ERROR_SEVERITIES.has(diagnostic?.severity)) {
    return "error";
  }

  if (diagnostic?.severity === "warning") {
    return "warning";
  }

  return "info";
}

function selectAnalysisRenderLevel(diagnostics) {
  if (!Array.isArray(diagnostics) || diagnostics.length === 0) {
    return "info";
  }

  if (
    diagnostics.some((diagnostic) =>
      ERROR_SEVERITIES.has(diagnostic?.severity),
    )
  ) {
    return "error";
  }

  return "warning";
}

async function showMessage({ window, rendering }) {
  if (rendering.level === "error") {
    await window.showErrorMessage(rendering.message);
    return;
  }

  if (rendering.level === "warning") {
    await window.showWarningMessage(rendering.message);
    return;
  }

  await window.showInformationMessage(rendering.message);
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function pluralize(count, singular) {
  return count === 1 ? singular : `${singular}s`;
}
