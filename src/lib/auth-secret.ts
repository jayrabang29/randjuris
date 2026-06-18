/**
 * Auth.js requires AUTH_SECRET in production (Vercel, etc.).
 * NEXTAUTH_SECRET is supported as a legacy alias.
 */
export function getAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  return secret?.trim() || undefined;
}
