"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import {
  categoryFilterSchema,
  categorySchema,
  type CategoryInput,
} from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";

export type CategoryItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  _count?: { documents: number };
};

export type CategoryOption = {
  id: string;
  name: string;
  code: string;
};

export async function getCategories(): Promise<ActionResult<CategoryItem[]>> {
  try {
    await requirePermission(PERMISSIONS.categories.read);

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { documents: true } } },
    });

    return { success: true, data: categories };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getCategoriesPaginated(
  params: { search?: string; page?: number; pageSize?: number } = {}
): Promise<ActionResult<PaginatedResult<CategoryItem>>> {
  try {
    await requirePermission(PERMISSIONS.categories.read);

    const parsed = categoryFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { search, page, pageSize } = parsed.data;
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
        include: { _count: { select: { documents: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.category.count({ where }),
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
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getCategoryOptions(): Promise<
  ActionResult<CategoryOption[]>
> {
  try {
    await requirePermission(PERMISSIONS.documents.read);

    const categories = await prisma.category.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    return { success: true, data: categories };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function createCategory(
  data: CategoryInput
): Promise<ActionResult<CategoryItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.categories.create);

    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: parsed.data.name }, { code: parsed.data.code }],
      },
    });
    if (existing) {
      return { success: false, error: "A category with this name or code exists" };
    }

    const category = await prisma.category.create({
      data: parsed.data,
      include: { _count: { select: { documents: true } } },
    });

    await logActivity({
      userId: actor.id,
      action: "CATEGORY_CREATED",
      entity: "Category",
      entityId: category.id,
      details: `Created category ${category.name}`,
    });

    return { success: true, data: category };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  data: CategoryInput
): Promise<ActionResult<CategoryItem>> {
  try {
    const actor = await requirePermission(PERMISSIONS.categories.update);

    if (!id) {
      return { success: false, error: "Category ID is required" };
    }

    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Category not found" };
    }

    const conflict = await prisma.category.findFirst({
      where: {
        OR: [{ name: parsed.data.name }, { code: parsed.data.code }],
        NOT: { id },
      },
    });
    if (conflict) {
      return { success: false, error: "A category with this name or code exists" };
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { documents: true } } },
    });

    await logActivity({
      userId: actor.id,
      action: "CATEGORY_UPDATED",
      entity: "Category",
      entityId: category.id,
      details: `Updated category ${category.name}`,
    });

    return { success: true, data: category };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.categories.delete);

    if (!id) {
      return { success: false, error: "Category ID is required" };
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { documents: true } } },
    });
    if (!existing) {
      return { success: false, error: "Category not found" };
    }

    if (existing._count.documents > 0) {
      return {
        success: false,
        error: "Cannot delete a category that is used by documents",
      };
    }

    await prisma.category.delete({ where: { id } });

    await logActivity({
      userId: actor.id,
      action: "CATEGORY_DELETED",
      entity: "Category",
      entityId: id,
      details: `Deleted category ${existing.name}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to delete category" };
  }
}
