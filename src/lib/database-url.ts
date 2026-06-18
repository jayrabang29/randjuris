/**
 * Ensures Prisma MySQL URLs work in serverless (Vercel) with a connection timeout.
 * Passwords with special characters (@, #, etc.) must be URL-encoded in DATABASE_URL.
 */
export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return undefined;
  }

  if (url.includes("connect_timeout=")) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=15`;
}
