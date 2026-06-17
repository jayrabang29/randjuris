"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import {
  clientFilterSchema,
  clientSchema,
  type ClientInput,
} from "@/validators";
import type { ActionResult, ClientWithCases, PaginatedResult } from "@/types";
import type { Client } from "@prisma/client";

export async function getClients(
  params: {
    search?: string;
    clientType?: "INDIVIDUAL" | "CORPORATE";
    includeArchived?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<ClientWithCases>>> {
  try {
    await requirePermission(PERMISSIONS.clients.read);

    const parsed = clientFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { search, clientType, includeArchived, page, pageSize } = parsed.data;
    const where = {
      ...(includeArchived ? {} : { isArchived: false }),
      ...(clientType ? { clientType } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { companyName: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: { _count: { select: { cases: true } } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.client.count({ where }),
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
    return { success: false, error: "Failed to fetch clients" };
  }
}

export async function getClient(id: string): Promise<ActionResult<Client>> {
  try {
    await requirePermission(PERMISSIONS.clients.read);

    if (!id) {
      return { success: false, error: "Client ID is required" };
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: { select: { cases: true } },
      },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    return { success: true, data: client };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch client" };
  }
}

export async function createClient(
  data: ClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await requirePermission(PERMISSIONS.clients.create);

    const parsed = clientSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.client.findFirst({
      where: { email: parsed.data.email, isArchived: false },
    });

    if (existing) {
      return { success: false, error: "A client with this email already exists" };
    }

    const client = await prisma.client.create({ data: parsed.data });

    await logActivity({
      userId: user.id,
      action: "CLIENT_CREATED",
      entity: "Client",
      entityId: client.id,
      details: `Created client ${client.firstName} ${client.lastName}`,
    });

    return { success: true, data: client };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create client" };
  }
}

export async function updateClient(
  id: string,
  data: ClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await requirePermission(PERMISSIONS.clients.update);

    if (!id) {
      return { success: false, error: "Client ID is required" };
    }

    const parsed = clientSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Client not found" };
    }

    const emailConflict = await prisma.client.findFirst({
      where: {
        email: parsed.data.email,
        isArchived: false,
        NOT: { id },
      },
    });

    if (emailConflict) {
      return { success: false, error: "A client with this email already exists" };
    }

    const client = await prisma.client.update({
      where: { id },
      data: parsed.data,
    });

    await logActivity({
      userId: user.id,
      action: "CLIENT_UPDATED",
      entity: "Client",
      entityId: client.id,
      details: `Updated client ${client.firstName} ${client.lastName}`,
    });

    return { success: true, data: client };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update client" };
  }
}

export async function archiveClient(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission(PERMISSIONS.clients.delete);

    if (!id) {
      return { success: false, error: "Client ID is required" };
    }

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Client not found" };
    }

    if (existing.isArchived) {
      return { success: false, error: "Client is already archived" };
    }

    await prisma.client.update({
      where: { id },
      data: { isArchived: true },
    });

    await logActivity({
      userId: user.id,
      action: "CLIENT_ARCHIVED",
      entity: "Client",
      entityId: id,
      details: `Archived client ${existing.firstName} ${existing.lastName}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to archive client" };
  }
}
