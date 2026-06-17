import { NextResponse } from "next/server";
import { markAllAsRead } from "@/actions/notifications";

export async function PATCH() {
  const result = await markAllAsRead();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
