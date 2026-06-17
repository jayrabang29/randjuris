"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { validateUserTeamAssignment } from "@/lib/team-assignment";
import {
  mapUserLegalServices,
  memberLegalServicesSelect,
} from "@/lib/legal-services";
import {
  addTeamMemberSchema,
  teamFilterSchema,
  teamSchema,
  type TeamInput,
} from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";

export type AvailableUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type TeamMember = AvailableUser & {
  legalServices: { id: string; name: string }[];
};

function mapTeamMember(member: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  legalServices: { legalService: { id: string; name: string } }[];
}): TeamMember {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    role: member.role,
    legalServices: mapUserLegalServices(member),
  };
}

const teamMemberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  ...memberLegalServicesSelect,
} as const;

function mapTeam(team: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  members: Parameters<typeof mapTeamMember>[0][];
  _count: { members: number };
}): TeamListItem {
  return {
    ...team,
    members: team.members.map(mapTeamMember),
  };
}

export type TeamListItem = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  members: TeamMember[];
  _count: { members: number };
};

export type TeamOption = {
  id: string;
  name: string;
};

export async function getTeams(
  params: { search?: string; page?: number; pageSize?: number } = {}
): Promise<ActionResult<PaginatedResult<TeamListItem>>> {
  try {
    await requirePermission(PERMISSIONS.teams.read);

    const parsed = teamFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { search, page, pageSize } = parsed.data;
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const [rawData, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          members: {
            select: teamMemberSelect,
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          },
          _count: { select: { members: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.team.count({ where }),
    ]);

    const data = rawData.map(mapTeam);

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
    return { success: false, error: "Failed to fetch teams" };
  }
}

export async function getTeamOptions(): Promise<ActionResult<TeamOption[]>> {
  try {
    await requirePermission(PERMISSIONS.users.read);

    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: teams };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch teams" };
  }
}

export async function getUnassignedUsers(): Promise<
  ActionResult<AvailableUser[]>
> {
  try {
    await requirePermission(PERMISSIONS.teams.update);

    const users = await prisma.user.findMany({
      where: { teamId: null, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return { success: true, data: users };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch available users" };
  }
}

export async function createTeam(
  data: TeamInput
): Promise<ActionResult<TeamListItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.teams.create);

    const parsed = teamSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.team.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return { success: false, error: "A team with this name already exists" };
    }

    const team = mapTeam(
      await prisma.team.create({
        data: parsed.data,
        include: {
          members: {
            select: teamMemberSelect,
          },
          _count: { select: { members: true } },
        },
      })
    );

    await logActivity({
      userId: actor.id,
      action: "TEAM_CREATED",
      entity: "Team",
      entityId: team.id,
      details: `Created team ${team.name}`,
    });

    return { success: true, data: team };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create team" };
  }
}

export async function updateTeam(
  id: string,
  data: TeamInput
): Promise<ActionResult<TeamListItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.teams.update);

    if (!id) {
      return { success: false, error: "Team ID is required" };
    }

    const parsed = teamSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Team not found" };
    }

    const nameConflict = await prisma.team.findFirst({
      where: { name: parsed.data.name, NOT: { id } },
    });
    if (nameConflict) {
      return { success: false, error: "A team with this name already exists" };
    }

    const team = mapTeam(
      await prisma.team.update({
        where: { id },
        data: parsed.data,
        include: {
          members: {
            select: teamMemberSelect,
          },
          _count: { select: { members: true } },
        },
      })
    );

    await logActivity({
      userId: actor.id,
      action: "TEAM_UPDATED",
      entity: "Team",
      entityId: team.id,
      details: `Updated team ${team.name}`,
    });

    return { success: true, data: team };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update team" };
  }
}

export async function deleteTeam(id: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.teams.delete);

    if (!id) {
      return { success: false, error: "Team ID is required" };
    }

    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Team not found" };
    }

    await prisma.team.delete({ where: { id } });

    await logActivity({
      userId: actor.id,
      action: "TEAM_DELETED",
      entity: "Team",
      entityId: id,
      details: `Deleted team ${existing.name}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to delete team" };
  }
}

export async function addTeamMember(
  teamId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.teams.update);

    const parsed = addTeamMemberSchema.safeParse({ teamId, userId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    const validation = await validateUserTeamAssignment(userId, teamId);
    if (!validation.ok) {
      return { success: false, error: validation.error };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.teamId === teamId) {
      return { success: false, error: "User is already on this team" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });

    await logActivity({
      userId: actor.id,
      action: "TEAM_MEMBER_ADDED",
      entity: "Team",
      entityId: teamId,
      details: `Added ${user.email} to team ${team.name}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to add team member" };
  }
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.teams.update);

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.teamId) {
      return { success: false, error: "User is not assigned to a team" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    await logActivity({
      userId: actor.id,
      action: "TEAM_MEMBER_REMOVED",
      entity: "Team",
      entityId: user.teamId,
      details: `Removed ${user.email} from team ${user.team?.name}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to remove team member" };
  }
}
