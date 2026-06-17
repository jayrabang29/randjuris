import { NextResponse } from "next/server";
import { getNotifications } from "@/actions/notifications";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : 20;

  const result = await getNotifications(limit);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ notifications: result.data });
}
