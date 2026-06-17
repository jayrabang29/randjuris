import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  hasPermissionInList,
  isSuperAdmin,
  PERMISSIONS,
} from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export type BillingAccessUser = {
  id: string;
  role: UserRole;
  teamId: string | null;
  permissions: string[];
};

export function canViewAllBilling(user: BillingAccessUser): boolean {
  if (isSuperAdmin(user.role)) {
    return true;
  }

  return hasPermissionInList(user.permissions, PERMISSIONS.billing.manage);
}

async function getTeamMemberIds(teamId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });

  return members.map((member) => member.id);
}

export async function buildTimeEntryAccessWhere(
  user: BillingAccessUser
): Promise<Prisma.TimeEntryWhereInput> {
  if (canViewAllBilling(user)) {
    return {};
  }

  if (!user.teamId) {
    return { userId: user.id };
  }

  const teamMemberIds = await getTeamMemberIds(user.teamId);
  return { userId: { in: teamMemberIds } };
}

export async function buildInvoiceAccessWhere(
  user: BillingAccessUser
): Promise<Prisma.InvoiceWhereInput> {
  if (canViewAllBilling(user)) {
    return {};
  }

  if (!user.teamId) {
    return {
      OR: [
        { items: { some: { timeEntry: { userId: user.id } } } },
        {
          items: {
            some: {
              case: { assignments: { some: { userId: user.id } } },
            },
          },
        },
      ],
    };
  }

  const teamMemberIds = await getTeamMemberIds(user.teamId);
  return {
    OR: [
      { items: { some: { timeEntry: { userId: { in: teamMemberIds } } } } },
      {
        items: {
          some: {
            case: {
              assignments: { some: { userId: { in: teamMemberIds } } },
            },
          },
        },
      },
    ],
  };
}

export async function canAccessInvoice(
  user: BillingAccessUser,
  invoiceId: string
): Promise<boolean> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      ...(await buildInvoiceAccessWhere(user)),
    },
    select: { id: true },
  });

  return !!invoice;
}

export async function canAccessTimeEntry(
  user: BillingAccessUser,
  timeEntryId: string
): Promise<boolean> {
  const timeEntry = await prisma.timeEntry.findFirst({
    where: {
      id: timeEntryId,
      ...(await buildTimeEntryAccessWhere(user)),
    },
    select: { id: true },
  });

  return !!timeEntry;
}
