"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import type { ActionResult, DashboardStats, PaginatedResult } from "@/types";
import { activityLogFilterSchema } from "@/validators";

type ActivityWithUser = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string } | null;
};

type ChartData = {
  casesByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  tasksByPriority: { priority: string; count: number }[];
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    await requirePermission(PERMISSIONS.dashboard.read);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalClients,
      activeCases,
      upcomingHearings,
      outstandingInvoices,
      tasksDueToday,
    ] = await Promise.all([
      prisma.client.count({ where: { isArchived: false } }),
      prisma.case.count({
        where: { status: { in: ["NEW", "ACTIVE", "PENDING", "IN_COURT"] } },
      }),
      prisma.event.count({
        where: {
          type: { in: ["HEARING", "COURT_APPEARANCE"] },
          startTime: { gte: now, lte: weekAhead },
        },
      }),
      prisma.invoice.count({
        where: { status: { in: ["SENT", "OVERDUE"] } },
      }),
      prisma.task.count({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalClients,
        activeCases,
        upcomingHearings,
        outstandingInvoices,
        tasksDueToday,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function getActivityLogs(
  params: { page?: number; pageSize?: number } = {}
): Promise<ActionResult<PaginatedResult<ActivityWithUser>>> {
  try {
    await requirePermission(PERMISSIONS.dashboard.read);

    const parsed = activityLogFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { page, pageSize } = parsed.data;

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.activityLog.count(),
    ]);

    return {
      success: true,
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch activity logs" };
  }
}

export async function getRecentActivities(
  limit = 10
): Promise<ActionResult<ActivityWithUser[]>> {
  try {
    await requirePermission(PERMISSIONS.dashboard.read);

    const activities = await prisma.activityLog.findMany({
      take: Math.min(limit, 50),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return { success: true, data: activities };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch recent activities" };
  }
}

export async function getChartData(): Promise<ActionResult<ChartData>> {
  try {
    await requirePermission(PERMISSIONS.dashboard.read);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [caseGroups, paidInvoices, taskGroups] = await Promise.all([
      prisma.case.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          paidAt: { gte: sixMonthsAgo },
        },
        select: { paidAt: true, totalAmount: true },
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: { status: { not: "COMPLETED" } },
        _count: { priority: true },
      }),
    ]);

    const casesByStatus = caseGroups.map((g) => ({
      status: g.status,
      count: g._count.status,
    }));

    const revenueMap = new Map<string, number>();
    for (const invoice of paidInvoices) {
      if (!invoice.paidAt) continue;
      const key = `${invoice.paidAt.getFullYear()}-${String(invoice.paidAt.getMonth() + 1).padStart(2, "0")}`;
      revenueMap.set(
        key,
        (revenueMap.get(key) ?? 0) + Number(invoice.totalAmount)
      );
    }

    const revenueByMonth = Array.from(revenueMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const tasksByPriority = taskGroups.map((g) => ({
      priority: g.priority,
      count: g._count.priority,
    }));

    return {
      success: true,
      data: { casesByStatus, revenueByMonth, tasksByPriority },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch chart data" };
  }
}
