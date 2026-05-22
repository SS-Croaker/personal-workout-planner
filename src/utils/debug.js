export function debugLog(scope, message, details) {
  if (!import.meta.env.DEV) {
    return;
  }

  if (details !== undefined) {
    console.debug(`[${scope}] ${message}`, details);
    return;
  }

  console.debug(`[${scope}] ${message}`);
}
