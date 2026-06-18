import { NextResponse } from "next/server";
import { getAuthSecret } from "@/lib/auth-secret";

export async function GET() {
  return NextResponse.json({
    ok: Boolean(getAuthSecret() && process.env.DATABASE_URL),
    environment: process.env.VERCEL_ENV ?? "local",
    hasAuthSecret: Boolean(getAuthSecret()),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });
}
