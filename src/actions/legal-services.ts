"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { syncUserLegalServices } from "@/lib/legal-services";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import {
  legalServiceSchema,
  legalServiceFilterSchema,
  updateUserLegalServicesSchema,
  type LegalServiceInput,
} from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";

export type LegalServiceItem = {
  id: string;
  name: string;
  description: string | null;
  _count?: { users: number };
};

export type LegalServiceOption = {
  id: string;
  name: string;
};

export async function getLegalServices(): Promise<
  ActionResult<LegalServiceItem[]>
> {
  try {
    await requirePermission(PERMISSIONS.legal_services.read);

    const services = await prisma.legalService.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    return { success: true, data: services };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch legal services" };
  }
}

export async function getLegalServicesPaginated(
  params: { search?: string; page?: number; pageSize?: number } = {}
): Promise<ActionResult<PaginatedResult<LegalServiceItem>>> {
  try {
    await requirePermission(PERMISSIONS.legal_services.read);

    const parsed = legalServiceFilterSchema.safeParse(params);
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

    const [data, total] = await Promise.all([
      prisma.legalService.findMany({
        where,
        orderBy: { name: "asc" },
        include: { _count: { select: { users: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.legalService.count({ where }),
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
    return { success: false, error: "Failed to fetch legal services" };
  }
}

export async function getLegalServiceOptions(): Promise<
  ActionResult<LegalServiceOption[]>
> {
  try {
    await requirePermission(PERMISSIONS.users.read);

    const services = await prisma.legalService.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: services };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch legal services" };
  }
}

export async function createLegalService(
  data: LegalServiceInput
): Promise<ActionResult<LegalServiceItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.legal_services.create);

    const parsed = legalServiceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.legalService.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return {
        success: false,
        error: "A legal service with this name already exists",
      };
    }

    const service = await prisma.legalService.create({
      data: parsed.data,
      include: { _count: { select: { users: true } } },
    });

    await logActivity({
      userId: actor.id,
      action: "LEGAL_SERVICE_CREATED",
      entity: "LegalService",
      entityId: service.id,
      details: `Created legal service ${service.name}`,
    });

    return { success: true, data: service };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create legal service" };
  }
}

export async function updateLegalService(
  id: string,
  data: LegalServiceInput
): Promise<ActionResult<LegalServiceItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.legal_services.update);

    if (!id) {
      return { success: false, error: "Legal service ID is required" };
    }

    const parsed = legalServiceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.legalService.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Legal service not found" };
    }

    const nameConflict = await prisma.legalService.findFirst({
      where: { name: parsed.data.name, NOT: { id } },
    });
    if (nameConflict) {
      return {
        success: false,
        error: "A legal service with this name already exists",
      };
    }

    const service = await prisma.legalService.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { users: true } } },
    });

    await logActivity({
      userId: actor.id,
      action: "LEGAL_SERVICE_UPDATED",
      entity: "LegalService",
      entityId: service.id,
      details: `Updated legal service ${service.name}`,
    });

    return { success: true, data: service };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update legal service" };
  }
}

export async function deleteLegalService(id: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.legal_services.delete);

    if (!id) {
      return { success: false, error: "Legal service ID is required" };
    }

    const existing = await prisma.legalService.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) {
      return { success: false, error: "Legal service not found" };
    }

    await prisma.legalService.delete({ where: { id } });

    await logActivity({
      userId: actor.id,
      action: "LEGAL_SERVICE_DELETED",
      entity: "LegalService",
      entityId: id,
      details: `Deleted legal service ${existing.name}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to delete legal service" };
  }
}

export async function updateUserLegalServices(
  userId: string,
  legalServiceIds: string[]
): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.legal_services.update);

    const parsed = updateUserLegalServicesSchema.safeParse({
      userId,
      legalServiceIds,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await syncUserLegalServices(userId, parsed.data.legalServiceIds);

    await logActivity({
      userId: actor.id,
      action: "USER_LEGAL_SERVICES_UPDATED",
      entity: "User",
      entityId: userId,
      details: `Updated legal services for ${user.email}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update legal services" };
  }
}
