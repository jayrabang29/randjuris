"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import {
  validateNewUserTeamAssignment,
  validateUserTeamAssignment,
} from "@/lib/team-assignment";
import {
  mapUserLegalServices,
  memberLegalServicesSelect,
  syncUserLegalServices,
} from "@/lib/legal-services";
import {
  createUserSchema,
  updateUserSchema,
  userFilterSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";

export type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  teamId: string | null;
  team: { id: string; name: string } | null;
  legalServices: { id: string; name: string }[];
};

const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  teamId: true,
  team: { select: { id: true, name: true } },
  ...memberLegalServicesSelect,
} as const;

function mapUserListItem(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  teamId: string | null;
  team: { id: string; name: string } | null;
  legalServices: { legalService: { id: string; name: string } }[];
}): UserListItem {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    teamId: user.teamId,
    team: user.team,
    legalServices: mapUserLegalServices(user),
  };
}

function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  return targetRole !== "SUPER_ADMIN";
}

export async function getUsers(
  params: {
    search?: string;
    role?: UserRole;
    status?: "active" | "inactive" | "all";
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<UserListItem>>> {
  try {
    await requirePermission(PERMISSIONS.users.read);

    const parsed = userFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { search, role, status, page, pageSize } = parsed.data;

    const where = {
      ...(role ? { role } : {}),
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [rawData, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userListSelect,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const data = rawData.map(mapUserListItem);

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
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createUser(
  data: CreateUserInput
): Promise<ActionResult<UserListItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.users.create);

    const parsed = createUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    if (!canManageRole(actor.role, parsed.data.role)) {
      return { success: false, error: "You cannot assign the Super Admin role" };
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    if (parsed.data.teamId) {
      const teamValidation = await validateNewUserTeamAssignment(
        parsed.data.teamId
      );
      if (!teamValidation.ok) {
        return { success: false, error: teamValidation.error };
      }
    }

    const user = mapUserListItem(
      await prisma.user.create({
        data: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          role: parsed.data.role,
          passwordHash,
          teamId: parsed.data.teamId || null,
        },
        select: userListSelect,
      })
    );

    await syncUserLegalServices(user.id, parsed.data.legalServiceIds ?? []);

    const refreshed = mapUserListItem(
      await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: userListSelect,
      })
    );

    await logActivity({
      userId: actor.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: refreshed.id,
      details: `Created user ${refreshed.email} (${refreshed.role})`,
    });

    return { success: true, data: refreshed };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<ActionResult<UserListItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.users.update);

    if (!id) {
      return { success: false, error: "User ID is required" };
    }

    const parsed = updateUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "User not found" };
    }

    if (!canManageRole(actor.role, existing.role)) {
      return { success: false, error: "You cannot modify this user" };
    }

    if (!canManageRole(actor.role, parsed.data.role)) {
      return { success: false, error: "You cannot assign the Super Admin role" };
    }

    if (actor.id === id && parsed.data.isActive === false) {
      return { success: false, error: "You cannot deactivate your own account" };
    }

    const emailConflict = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id } },
    });

    if (emailConflict) {
      return { success: false, error: "A user with this email already exists" };
    }

    const nextTeamId =
      parsed.data.teamId === undefined
        ? existing.teamId
        : parsed.data.teamId || null;

    if (nextTeamId !== existing.teamId) {
      if (nextTeamId) {
        const teamValidation = await validateUserTeamAssignment(id, nextTeamId);
        if (!teamValidation.ok) {
          return { success: false, error: teamValidation.error };
        }
      }
    }

    const passwordHash = parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 12)
      : undefined;

    const user = mapUserListItem(
      await prisma.user.update({
        where: { id },
        data: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          phone: parsed.data.phone,
          role: parsed.data.role,
          ...(parsed.data.isActive !== undefined
            ? { isActive: parsed.data.isActive }
            : {}),
          ...(parsed.data.teamId !== undefined ? { teamId: nextTeamId } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: userListSelect,
      })
    );

    if (parsed.data.legalServiceIds !== undefined) {
      await syncUserLegalServices(user.id, parsed.data.legalServiceIds);
    }

    const refreshed = mapUserListItem(
      await prisma.user.findUniqueOrThrow({
        where: { id },
        select: userListSelect,
      })
    );

    await logActivity({
      userId: actor.id,
      action: "USER_UPDATED",
      entity: "User",
      entityId: refreshed.id,
      details: `Updated user ${refreshed.email}`,
    });

    return { success: true, data: refreshed };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update user" };
  }
}

export async function toggleUserActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.users.update);

    if (!id) {
      return { success: false, error: "User ID is required" };
    }

    if (actor.id === id) {
      return { success: false, error: "You cannot deactivate your own account" };
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "User not found" };
    }

    if (!canManageRole(actor.role, existing.role)) {
      return { success: false, error: "You cannot modify this user" };
    }

    await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    await logActivity({
      userId: actor.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity: "User",
      entityId: id,
      details: `${isActive ? "Activated" : "Deactivated"} user ${existing.email}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update user status" };
  }
}
