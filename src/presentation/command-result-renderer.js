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
  const detail = selectDetail(result?.detail);
  const event = selectProductEvent(result?.events);
  if (isBatchInstallEvent(event)) {
    return {
      level: selectBatchInstallRenderLevel(event),
      message: createBatchInstallMessage({ prefix, result, event }),
    };
  }

  if (isAnalysisCompletedEvent(event)) {
    return {
      level: selectAnalysisRenderLevel(result?.diagnostics),
      message: createAnalysisCompletedMessage({ prefix, event }),
    };
  }

  if (result?.ok !== false && detail) {
    return {
      level: selectDetailRenderLevel(detail),
      message: createDetailMessage({ prefix, detail }),
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

function selectDetail(detail) {
  if (!detail || typeof detail !== "object" || typeof detail.type !== "string") {
    return null;
  }

  return detail;
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

    const backupLifecycleMessage = createBackupLifecycleMessage({
      result,
      event,
    });
    if (backupLifecycleMessage) {
      return `${prefix}: ${event.code} - ${backupLifecycleMessage}`;
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

function createDetailMessage({ prefix, detail }) {
  if (detail.type === "source") {
    return `${prefix}: skill.detail.ready - ${displayText(detail.name, "source skill")} source detail. Use Open SKILL.md to inspect files.`;
  }

  if (detail.type === "applied") {
    return `${prefix}: skill.detail.ready - ${displayText(detail.name, "applied skill")} applied detail. Use Open Target Folder to inspect installed files.`;
  }

  if (detail.type === "backup") {
    return `${prefix}: skill.detail.ready - ${displayText(detail.skillName, "skill")} backup ${displayText(detail.snapshotId, "snapshot")}. Use Promote Backup or Delete Backup from context menu.`;
  }

  if (detail.type === "diagnostic") {
    return `${prefix}: skill.detail.ready - ${displayText(detail.code, "diagnostic")} diagnostic. Review recommendation before applying.`;
  }

  return `${prefix}: skill.detail.ready`;
}

function createAnalysisCompletedMessage({ prefix, event }) {
  const skillCount = numberOrZero(event?.skillCount);
  const diagnosticCount = numberOrZero(event?.diagnosticCount);

  if (diagnosticCount === 0) {
    return `${prefix}: ${event.code} - ${skillCount} ${pluralize(skillCount, "skill")} analyzed, no diagnostics found.`;
  }

  return `${prefix}: ${event.code} - ${skillCount} ${pluralize(skillCount, "skill")} analyzed, ${diagnosticCount} ${pluralize(diagnosticCount, "diagnostic")} found. Check Diagnostics for details.`;
}

function createBatchInstallMessage({ prefix, result, event }) {
  const discoveredCount = numberOrZero(
    result?.installSummary?.discoveredCount ?? event?.discoveredCount,
  );
  const installedCount = numberOrZero(
    result?.installSummary?.installedCount ?? event?.installedCount,
  );
  const failedCount = numberOrZero(
    result?.installSummary?.failedCount ?? event?.failedCount,
  );
  const diagnosticsHint = failedCount > 0 ? " Check Diagnostics for details." : "";

  return `${prefix}: ${event.code} - ${discoveredCount} ${pluralize(discoveredCount, "skill")} discovered, ${installedCount} installed, ${failedCount} failed.${diagnosticsHint}`;
}

function createBackupLifecycleMessage({ result, event }) {
  if (event?.code === "skill.backup.compare.completed") {
    return createBackupCompareMessage({ result, event });
  }

  if (event?.code === "skill.backup.restore.completed") {
    return createBackupRestoreMessage({ result });
  }

  if (event?.code === "skill.backup.delete.completed") {
    return "Deleted backup snapshot.";
  }

  return "";
}

function createBackupCompareMessage({ result, event }) {
  const backupOnlyFileCount = numberOrZero(
    event?.backupOnlyFileCount ?? result?.comparison?.backupOnlyFileCount,
  );
  const referenceOnlyFileCount = numberOrZero(
    event?.referenceOnlyFileCount ?? result?.comparison?.referenceOnlyFileCount,
  );
  const modifiedFileCount = numberOrZero(
    event?.modifiedFileCount ?? result?.comparison?.modifiedFileCount,
  );
  const hasDifferences =
    backupOnlyFileCount + referenceOnlyFileCount + modifiedFileCount > 0;

  if (!hasDifferences) {
    return "Backup is in sync with reference.";
  }

  return `Backup differs: ${backupOnlyFileCount} backup-only, ${referenceOnlyFileCount} reference-only, ${modifiedFileCount} modified.`;
}

function createBackupRestoreMessage({ result }) {
  const restored = result?.restored ?? {};
  const skillName = displayText(restored.skillName, "skill");
  const snapshotId = displayText(restored.snapshotId, "selected snapshot");

  return `Restored ${skillName} from backup ${snapshotId} to selected target.`;
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

function isBatchInstallEvent(event) {
  return new Set([
    "skill.install.batch.completed",
    "skill.install.batch.partially-completed",
    "skill.install.batch.failed",
  ]).has(event?.code);
}

function selectBatchInstallRenderLevel(event) {
  if (event?.code === "skill.install.batch.failed") {
    return "error";
  }

  if (event?.code === "skill.install.batch.partially-completed") {
    return "warning";
  }

  return "info";
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

function selectDetailRenderLevel(detail) {
  if (detail.type === "diagnostic" && ERROR_SEVERITIES.has(detail.severity)) {
    return "error";
  }

  if (detail.type === "diagnostic" && detail.severity === "warning") {
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

function displayText(value, fallback) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return fallback;
}
