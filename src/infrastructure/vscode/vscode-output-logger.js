import { createEventLogger } from "../logging/event-logger.js";

export function createVsCodeOutputChannelLogger({
  window,
  channelName = "Sponzey Skills",
  fieldDebugEnabled = false,
  developmentEnabled = false,
} = {}) {
  if (typeof window?.createOutputChannel !== "function") {
    return null;
  }

  const channel = window.createOutputChannel(channelName);
  const sink = (level) => async (event) => {
    channel.appendLine(formatLogLine({ level, event }));
  };

  return createEventLogger({
    productSink: sink("ProductLog"),
    fieldDebugSink: sink("FieldDebugLog"),
    developmentSink: sink("DevelopmentLog"),
    fieldDebugEnabled,
    developmentEnabled,
  });
}

function formatLogLine({ level, event }) {
  return JSON.stringify({
    level,
    code: event?.code,
    event,
  });
}
