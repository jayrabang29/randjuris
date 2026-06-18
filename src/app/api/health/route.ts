import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { getDatabaseUrl } from "@/lib/database-url";

export async function GET() {
  const hasAuthSecret = Boolean(getAuthSecret());
  const hasDatabaseUrl = Boolean(getDatabaseUrl());
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null;

  let databaseOk = false;
  let databaseError: string | null = null;

  if (hasDatabaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : "Database connection failed";
    }
  }

  const session = await auth();
  const hasSession = Boolean(session?.user?.email && session?.user?.role);

  return NextResponse.json({
    ok: hasAuthSecret && databaseOk,
    environment: process.env.VERCEL_ENV ?? "local",
    vercelUrl: process.env.VERCEL_URL ?? null,
    authUrlConfigured: Boolean(authUrl),
    authUrlWarning: authUrl
      ? "Remove AUTH_URL/NEXTAUTH_URL on Vercel unless you use a custom domain that matches the URL you browse."
      : null,
    hasAuthSecret,
    hasDatabaseUrl,
    databaseOk,
    databaseError,
    hasSession,
    sessionUser: hasSession
      ? {
          email: session?.user?.email,
          role: session?.user?.role,
        }
      : null,
  });
}
