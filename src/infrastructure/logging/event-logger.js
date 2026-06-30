export function createEventLogger({
  productSink,
  fieldDebugSink,
  developmentSink,
  fieldDebugEnabled = false,
  developmentEnabled = false,
} = {}) {
  return {
    async product(event) {
      if (typeof productSink === "function") {
        await productSink(maskEvent(event));
      }
    },
    async fieldDebug(event) {
      if (fieldDebugEnabled && typeof fieldDebugSink === "function") {
        await fieldDebugSink(maskEvent(event));
      }
    },
    async development(event) {
      if (developmentEnabled && typeof developmentSink === "function") {
        await developmentSink(maskEvent(event));
      }
    },
  };
}

export function maskEvent(event) {
  return maskValue(event);
}

function maskValue(value) {
  if (Array.isArray(value)) {
    return value.map(maskValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        sensitiveKey(key) ? "[masked]" : maskValue(entryValue),
      ]),
    );
  }

  if (typeof value === "string") {
    return maskString(value);
  }

  return value;
}

function sensitiveKey(key) {
  return /secret|token|apiKey|api_key|credential|body|content/i.test(key);
}

function maskString(value) {
  const home = process.env.HOME;
  const homeMasked =
    typeof home === "string" && home.length > 0
      ? value.replaceAll(home, "~")
      : value;

  return homeMasked
    .replace(/\/Users\/[^/\s]+/g, "~/")
    .replace(/\b[A-Za-z0-9._%+-]+(?:token|secret|key)[A-Za-z0-9._%+-]*\b/gi, "[masked]");
}
