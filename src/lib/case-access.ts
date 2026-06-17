import { DocumentVisibility, UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  hasPermissionInList,
  isSuperAdmin,
  PERMISSIONS,
} from "@/lib/permissions";

export type CaseAccessUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
  permissions: string[];
};

export type CaseAccessRecord = {
  visibility: DocumentVisibility;
  teamId: string | null;
  createdById: string | null;
};

export function canViewAllCases(user: CaseAccessUser): boolean {
  if (isSuperAdmin(user.role)) {
    return true;
  }

  return hasPermissionInList(user.permissions, PERMISSIONS.cases.manage);
}

export function buildCaseAccessWhere(
  user: CaseAccessUser
): Prisma.CaseWhereInput {
  if (canViewAllCases(user)) {
    return {};
  }

  return {
    OR: [
      { visibility: DocumentVisibility.GENERAL },
      { createdById: user.id },
      { assignments: { some: { userId: user.id } } },
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

export function canAccessCase(
  user: CaseAccessUser,
  caseRecord: CaseAccessRecord,
  options?: { isAssigned?: boolean }
): boolean {
  if (canViewAllCases(user)) {
    return true;
  }

  if (options?.isAssigned) {
    return true;
  }

  if (caseRecord.visibility === DocumentVisibility.GENERAL) {
    return true;
  }

  if (caseRecord.createdById === user.id) {
    return true;
  }

  return (
    caseRecord.visibility === DocumentVisibility.TEAM &&
    !!caseRecord.teamId &&
    caseRecord.teamId === user.teamId
  );
}
