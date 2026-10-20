export function reportLovableError(error: Error, context?: Record<string, string>) {
  console.error("[ErrorReport]", error.message, context);
}
