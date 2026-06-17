"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity, createNotification } from "@/lib/activity";
import {
  buildTaskAccessWhere,
  canAccessTask,
} from "@/lib/task-access";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { taskFilterSchema, taskSchema, type TaskInput } from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";
import type { Task } from "@prisma/client";

type TaskWithRelations = Task & {
  case: { id: string; caseNumber: string; title: string } | null;
  assignee: { id: string; firstName: string; lastName: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  team: { id: string; name: string } | null;
};

async function getTaskAccessUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true, teamId: true },
  });
}

export async function getTasks(
  params: {
    status?: Task["status"];
    priority?: Task["priority"];
    assigneeId?: string;
    caseId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<TaskWithRelations>>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.tasks.read);
    const accessUser = await getTaskAccessUser(sessionUser.id);

    const parsed = taskFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { status, priority, assigneeId, caseId, page, pageSize } =
      parsed.data;
    const where = {
      ...buildTaskAccessWhere(accessUser),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(caseId ? { caseId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.task.count({ where }),
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
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function createTask(
  data: TaskInput
): Promise<ActionResult<Task>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.tasks.create);
    const accessUser = await getTaskAccessUser(sessionUser.id);

    const parsed = taskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    if (parsed.data.visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to create team-only tasks",
      };
    }

    if (parsed.data.caseId) {
      const caseRecord = await prisma.case.findUnique({
        where: { id: parsed.data.caseId },
      });
      if (!caseRecord) {
        return { success: false, error: "Case not found" };
      }
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status ?? "TODO",
        priority: parsed.data.priority ?? "MEDIUM",
        visibility: parsed.data.visibility,
        teamId:
          parsed.data.visibility === "TEAM" ? accessUser.teamId : null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        caseId: parsed.data.caseId,
        assigneeId: parsed.data.assigneeId,
        createdById: accessUser.id,
      },
    });

    await logActivity({
      userId: accessUser.id,
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      details: `Created ${parsed.data.visibility.toLowerCase()} task "${task.title}"`,
    });

    if (parsed.data.assigneeId && parsed.data.assigneeId !== accessUser.id) {
      await createNotification({
        userId: parsed.data.assigneeId,
        type: "GENERAL",
        title: "New Task Assigned",
        message: `You have been assigned task "${task.title}"`,
        link: `/tasks`,
      });
    }

    return { success: true, data: task };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(
  id: string,
  data: TaskInput
): Promise<ActionResult<Task>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.tasks.update);
    const accessUser = await getTaskAccessUser(sessionUser.id);

    if (!id) {
      return { success: false, error: "Task ID is required" };
    }

    const parsed = taskSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Task not found" };
    }

    if (!canAccessTask(accessUser, existing)) {
      return { success: false, error: "You do not have access to this task" };
    }

    if (parsed.data.visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to create team-only tasks",
      };
    }

    const newStatus = parsed.data.status ?? existing.status;
    const completedAt =
      newStatus === "COMPLETED" && existing.status !== "COMPLETED"
        ? new Date()
        : newStatus !== "COMPLETED"
          ? null
          : existing.completedAt;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: newStatus,
        priority: parsed.data.priority ?? existing.priority,
        visibility: parsed.data.visibility,
        teamId:
          parsed.data.visibility === "TEAM" ? accessUser.teamId : null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        caseId: parsed.data.caseId,
        assigneeId: parsed.data.assigneeId,
        completedAt,
      },
    });

    await logActivity({
      userId: accessUser.id,
      action: "TASK_UPDATED",
      entity: "Task",
      entityId: task.id,
      details: `Updated task "${task.title}"`,
    });

    return { success: true, data: task };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.tasks.delete);
    const accessUser = await getTaskAccessUser(sessionUser.id);

    if (!id) {
      return { success: false, error: "Task ID is required" };
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Task not found" };
    }

    if (!canAccessTask(accessUser, existing)) {
      return { success: false, error: "You do not have access to this task" };
    }

    await prisma.task.delete({ where: { id } });

    await logActivity({
      userId: accessUser.id,
      action: "TASK_DELETED",
      entity: "Task",
      entityId: id,
      details: `Deleted task "${existing.title}"`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to delete task" };
  }
}
