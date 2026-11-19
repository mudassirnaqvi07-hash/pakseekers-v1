/**
 * Admin Entry Path Configuration — PakSeekers.
 *
 * Resolves the secret admin entry point from the ADMIN_ENTRY_PATH
 * environment variable (defaults to "/admin-gate" if not configured).
 *
 * NOTE: This function reads server environment variables and must only be
 * invoked in server-side contexts (proxy, server components, server actions).
 * Do not import or bundle in client-side components.
 */

export function getAdminEntryPath(): string {
  const envPath = process.env.ADMIN_ENTRY_PATH?.trim();
  if (!envPath) {
    return "/admin-gate";
  }

  // Ensure leading slash
  let path = envPath.startsWith("/") ? envPath : `/${envPath}`;
  // Strip trailing slashes
  if (path.length > 1 && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }

  return path;
}
