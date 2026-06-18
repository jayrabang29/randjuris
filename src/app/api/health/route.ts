import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { getDatabaseUrl } from "@/lib/database-url";

export async function GET() {
  const hasAuthSecret = Boolean(getAuthSecret());
  const hasDatabaseUrl = Boolean(getDatabaseUrl());

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

  return NextResponse.json({
    ok: hasAuthSecret && databaseOk,
    environment: process.env.VERCEL_ENV ?? "local",
    hasAuthSecret,
    hasDatabaseUrl,
    databaseOk,
    databaseError,
  });
}
