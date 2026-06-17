import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    environment: process.env.VERCEL_ENV ?? "local",
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });
}
