"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity, createNotification } from "@/lib/activity";
import {
  buildCaseAccessWhere,
  canAccessCase,
  type CaseAccessUser,
} from "@/lib/case-access";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import {
  assignLawyersSchema,
  caseFilterSchema,
  caseNoteFilterSchema,
  caseNoteSchema,
  caseSchema,
  type CaseInput,
} from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";
import type { Case, CaseNote, Prisma } from "@prisma/client";

type CaseWithRelations = Case & {
  client: { id: string; firstName: string; lastName: string; email: string };
  assignments: {
    id: string;
    isLead: boolean;
    user: { id: string; firstName: string; lastName: string; email: string };
  }[];
};

async function getCaseAccessUser(
  userId: string,
  permissions: string[]
): Promise<CaseAccessUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true, teamId: true },
  });

  return {
    ...user,
    permissions,
  };
}

function buildCasesWhere(
  accessUser: CaseAccessUser,
  filters: {
    search?: string;
    status?: Case["status"];
    category?: Case["category"];
    clientId?: string;
  }
): Prisma.CaseWhereInput {
  const accessWhere = buildCaseAccessWhere(accessUser);
  const filterWhere: Prisma.CaseWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.search
      ? {
          OR: [
            { caseNumber: { contains: filters.search } },
            { title: { contains: filters.search } },
            { courtName: { contains: filters.search } },
          ],
        }
      : {}),
  };

  const clauses = [accessWhere, filterWhere].filter(
    (clause) => Object.keys(clause).length > 0
  );

  if (clauses.length === 0) {
    return {};
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return { AND: clauses };
}

async function assertCaseAccess(
  accessUser: CaseAccessUser,
  caseId: string
): Promise<Case | null> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      assignments: { select: { userId: true } },
    },
  });

  if (!caseRecord) {
    return null;
  }

  const isAssigned = caseRecord.assignments.some(
    (assignment) => assignment.userId === accessUser.id
  );

  if (
    !canAccessCase(
      accessUser,
      {
        visibility: caseRecord.visibility,
        teamId: caseRecord.teamId,
        createdById: caseRecord.createdById,
      },
      { isAssigned }
    )
  ) {
    return null;
  }

  return caseRecord;
}

export async function getCases(
  params: {
    search?: string;
    status?: Case["status"];
    category?: Case["category"];
    clientId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<CaseWithRelations>>> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.read);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    const parsed = caseFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { search, status, category, clientId, page, pageSize } = parsed.data;
    const where = buildCasesWhere(accessUser, {
      search,
      status,
      category,
      clientId,
    });

    const [data, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.case.count({ where }),
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
    return { success: false, error: "Failed to fetch cases" };
  }
}

export async function getCase(
  id: string
): Promise<ActionResult<CaseWithRelations>> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.read);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    if (!id) {
      return { success: false, error: "Case ID is required" };
    }

    const caseRecord = await prisma.case.findFirst({
      where: {
        id,
        ...buildCaseAccessWhere(accessUser),
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    return { success: true, data: caseRecord };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch case" };
  }
}

export async function createCase(
  data: CaseInput
): Promise<ActionResult<Case>> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.create);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    const parsed = caseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { lawyerIds, filingDate, visibility, ...caseData } = parsed.data;

    if (visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to create team-only cases",
      };
    }

    const client = await prisma.client.findFirst({
      where: { id: caseData.clientId, isArchived: false },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    const existingCase = await prisma.case.findUnique({
      where: { caseNumber: caseData.caseNumber },
    });

    if (existingCase) {
      return { success: false, error: "Case number already exists" };
    }

    const caseRecord = await prisma.case.create({
      data: {
        ...caseData,
        visibility,
        teamId: visibility === "TEAM" ? accessUser.teamId : null,
        createdById: accessUser.id,
        filingDate: filingDate ? new Date(filingDate) : null,
        assignments: lawyerIds?.length
          ? {
              create: lawyerIds.map((userId, index) => ({
                userId,
                isLead: index === 0,
              })),
            }
          : undefined,
      },
    });

    await logActivity({
      userId: user.id,
      action: "CASE_CREATED",
      entity: "Case",
      entityId: caseRecord.id,
      details: `Created case ${caseRecord.caseNumber}: ${caseRecord.title}`,
    });

    if (lawyerIds?.length) {
      for (const lawyerId of lawyerIds) {
        if (lawyerId !== user.id) {
          await createNotification({
            userId: lawyerId,
            type: "CASE_ASSIGNMENT",
            title: "New Case Assignment",
            message: `You have been assigned to case ${caseRecord.caseNumber}`,
            link: `/cases/${caseRecord.id}`,
          });
        }
      }
    }

    return { success: true, data: caseRecord };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create case" };
  }
}

export async function updateCase(
  id: string,
  data: CaseInput
): Promise<ActionResult<Case>> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.update);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    if (!id) {
      return { success: false, error: "Case ID is required" };
    }

    const parsed = caseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await assertCaseAccess(accessUser, id);
    if (!existing) {
      return { success: false, error: "Case not found" };
    }

    const {
      lawyerIds: _unusedLawyerIds,
      filingDate,
      visibility,
      ...caseData
    } = parsed.data;
    void _unusedLawyerIds;

    if (visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to set team-only visibility",
      };
    }

    if (caseData.caseNumber !== existing.caseNumber) {
      const duplicate = await prisma.case.findUnique({
        where: { caseNumber: caseData.caseNumber },
      });
      if (duplicate) {
        return { success: false, error: "Case number already exists" };
      }
    }

    const caseRecord = await prisma.case.update({
      where: { id },
      data: {
        ...caseData,
        visibility,
        teamId: visibility === "TEAM" ? accessUser.teamId : null,
        filingDate: filingDate ? new Date(filingDate) : null,
      },
    });

    await logActivity({
      userId: user.id,
      action: "CASE_UPDATED",
      entity: "Case",
      entityId: caseRecord.id,
      details: `Updated case ${caseRecord.caseNumber}`,
    });

    return { success: true, data: caseRecord };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update case" };
  }
}

export async function assignLawyers(data: {
  caseId: string;
  lawyerIds: string[];
  leadLawyerId?: string;
}): Promise<ActionResult> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.update);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    const parsed = assignLawyersSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { caseId, lawyerIds, leadLawyerId } = parsed.data;

    const caseRecord = await assertCaseAccess(accessUser, caseId);
    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    const leadId = leadLawyerId ?? lawyerIds[0];

    await prisma.$transaction([
      prisma.caseAssignment.deleteMany({ where: { caseId } }),
      prisma.caseAssignment.createMany({
        data: lawyerIds.map((userId) => ({
          caseId,
          userId,
          isLead: userId === leadId,
        })),
      }),
    ]);

    await logActivity({
      userId: user.id,
      action: "CASE_LAWYERS_ASSIGNED",
      entity: "Case",
      entityId: caseId,
      details: `Assigned ${lawyerIds.length} lawyer(s) to case ${caseRecord.caseNumber}`,
    });

    for (const lawyerId of lawyerIds) {
      if (lawyerId !== user.id) {
        await createNotification({
          userId: lawyerId,
          type: "CASE_ASSIGNMENT",
          title: "Case Assignment Updated",
          message: `You have been assigned to case ${caseRecord.caseNumber}`,
          link: `/cases/${caseId}`,
        });
      }
    }

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to assign lawyers" };
  }
}

export async function addCaseNote(data: {
  caseId: string;
  content: string;
}): Promise<ActionResult<CaseNote>> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.update);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    const parsed = caseNoteSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const caseRecord = await assertCaseAccess(accessUser, parsed.data.caseId);

    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    const note = await prisma.caseNote.create({
      data: {
        caseId: parsed.data.caseId,
        content: parsed.data.content,
        createdBy: user.id,
      },
    });

    await logActivity({
      userId: user.id,
      action: "CASE_NOTE_ADDED",
      entity: "CaseNote",
      entityId: note.id,
      details: `Added note to case ${caseRecord.caseNumber}`,
    });

    return { success: true, data: note };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to add case note" };
  }
}

export async function getCaseNotes(
  caseId: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<ActionResult<PaginatedResult<CaseNote>>> {
  try {
    const user = await requirePermission(PERMISSIONS.cases.read);
    const accessUser = await getCaseAccessUser(user.id, user.permissions);

    if (!caseId) {
      return { success: false, error: "Case ID is required" };
    }

    const parsed = caseNoteFilterSchema.safeParse({ caseId, ...params });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { page, pageSize } = parsed.data;

    const caseRecord = await assertCaseAccess(accessUser, caseId);
    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    const [data, total] = await Promise.all([
      prisma.caseNote.findMany({
        where: { caseId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.caseNote.count({ where: { caseId } }),
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
    return { success: false, error: "Failed to fetch case notes" };
  }
}
