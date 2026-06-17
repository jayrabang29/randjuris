import { headers } from "next/headers";
import prisma from "./prisma";

export async function logActivity(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}) {
  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  let userId = params.userId;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      userId = undefined;
    }
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
      ipAddress,
    },
  });
}

export async function createNotification(params: {
  userId: string;
  type:
    | "HEARING_REMINDER"
    | "TASK_DEADLINE"
    | "INVOICE_DUE"
    | "CASE_ASSIGNMENT"
    | "GENERAL";
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}
