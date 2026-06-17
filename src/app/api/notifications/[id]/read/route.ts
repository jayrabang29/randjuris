import { NextResponse } from "next/server";
import { markAsRead } from "@/actions/notifications";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const result = await markAsRead(id);

  if (!result.success) {
    const status = result.error === "Notification not found" ? 404 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true });
}
