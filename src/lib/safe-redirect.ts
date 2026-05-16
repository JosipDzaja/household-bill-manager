/** Relative in-app path only; blocks open redirects. */
export function safeInternalPath(path: string | undefined | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("://") || path.includes("\\")) return null;
  return path;
}
