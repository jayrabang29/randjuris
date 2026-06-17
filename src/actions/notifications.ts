"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import type { ActionResult } from "@/types";
import type { Notification } from "@prisma/client";

export async function getNotifications(
  limit = 20
): Promise<ActionResult<Notification[]>> {
  try {
    const user = await requireAuth();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });

    return { success: true, data: notifications };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    if (!id) {
      return { success: false, error: "Notification ID is required" };
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllAsRead(): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}

export async function getUnreadCount(): Promise<ActionResult<number>> {
  try {
    const user = await requireAuth();

    const count = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return { success: true, data: count };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch unread count" };
  }
}
