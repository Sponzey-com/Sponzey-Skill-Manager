export function confirmationRequiredDiagnostic({
  code,
  operation,
  confirmationKey,
  message,
  severity = "error",
}) {
  return {
    code,
    severity,
    category: "confirmation",
    operation,
    confirmationKey,
    required: true,
    message,
  };
}
