import { DocumentVisibility, UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type TaskAccessUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
};

export type TaskAccessRecord = {
  visibility: DocumentVisibility;
  teamId: string | null;
  createdById: string;
  assigneeId: string | null;
};

export function canBypassTaskVisibility(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGING_PARTNER";
}

export function buildTaskAccessWhere(
  user: TaskAccessUser
): Prisma.TaskWhereInput {
  if (canBypassTaskVisibility(user.role)) {
    return {};
  }

  return {
    OR: [
      { visibility: DocumentVisibility.GENERAL },
      { createdById: user.id },
      { assigneeId: user.id },
      ...(user.teamId
        ? [
            {
              visibility: DocumentVisibility.TEAM,
              teamId: user.teamId,
            },
          ]
        : []),
    ],
  };
}

export function canAccessTask(
  user: TaskAccessUser,
  task: TaskAccessRecord
): boolean {
  if (canBypassTaskVisibility(user.role)) {
    return true;
  }

  if (task.visibility === DocumentVisibility.GENERAL) {
    return true;
  }

  if (task.createdById === user.id || task.assigneeId === user.id) {
    return true;
  }

  return (
    task.visibility === DocumentVisibility.TEAM &&
    !!task.teamId &&
    task.teamId === user.teamId
  );
}
