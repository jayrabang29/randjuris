"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  buildDocumentAccessWhere,
  canAccessDocument,
} from "@/lib/document-access";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { storage, getAbsolutePath } from "@/lib/storage";
import { documentFilterSchema, documentUploadSchema } from "@/validators";
import type { ActionResult, PaginatedResult } from "@/types";
import type { Document } from "@prisma/client";

type DocumentWithRelations = Document & {
  case: { id: string; caseNumber: string; title: string };
  uploadedBy: { id: string; firstName: string; lastName: string };
  category: { id: string; name: string; code: string };
  team: { id: string; name: string } | null;
};

async function getDocumentAccessUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, role: true, teamId: true },
  });
}

export async function getDocuments(
  params: {
    caseId?: string;
    search?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ActionResult<PaginatedResult<DocumentWithRelations>>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.documents.read);
    const accessUser = await getDocumentAccessUser(sessionUser.id);

    const parsed = documentFilterSchema.safeParse(params);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { caseId, search, categoryId, page, pageSize } = parsed.data;
    const where = {
      ...buildDocumentAccessWhere(accessUser),
      ...(caseId ? { caseId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { fileName: { contains: search } } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          case: { select: { id: true, caseNumber: true, title: true } },
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          category: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count({ where }),
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
    return { success: false, error: "Failed to fetch documents" };
  }
}

export async function uploadDocument(
  formData: FormData
): Promise<ActionResult<Document>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.documents.create);
    const accessUser = await getDocumentAccessUser(sessionUser.id);

    const file = formData.get("file") as File | null;
    const caseId = formData.get("caseId") as string;
    const categoryId = formData.get("categoryId") as string;
    const visibility = (formData.get("visibility") as string) || "GENERAL";

    if (!file || file.size === 0) {
      return { success: false, error: "File is required" };
    }

    const parsed = documentUploadSchema.safeParse({
      caseId,
      categoryId,
      visibility,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    if (parsed.data.visibility === "TEAM" && !accessUser.teamId) {
      return {
        success: false,
        error: "You must belong to a team to upload team-only documents",
      };
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id: parsed.data.caseId },
    });

    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) {
      return { success: false, error: "Category not found" };
    }

    const stored = await storage.store(file, `cases/${parsed.data.caseId}`);

    const document = await prisma.document.create({
      data: {
        fileName: stored.fileName,
        fileType: stored.fileType,
        fileSize: stored.fileSize,
        storageUrl: stored.storageUrl,
        categoryId: parsed.data.categoryId,
        visibility: parsed.data.visibility,
        teamId:
          parsed.data.visibility === "TEAM" ? accessUser.teamId : null,
        caseId: parsed.data.caseId,
        uploadedById: accessUser.id,
      },
    });

    await logActivity({
      userId: accessUser.id,
      action: "DOCUMENT_UPLOADED",
      entity: "Document",
      entityId: document.id,
      details: `Uploaded ${parsed.data.visibility.toLowerCase()} document "${document.fileName}" to case ${caseRecord.caseNumber}`,
    });

    return { success: true, data: document };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to upload document" };
  }
}

export async function downloadDocument(
  id: string
): Promise<ActionResult<{ path: string; fileName: string; fileType: string }>> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.documents.read);
    const accessUser = await getDocumentAccessUser(sessionUser.id);

    if (!id) {
      return { success: false, error: "Document ID is required" };
    }

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document || !canAccessDocument(accessUser, document)) {
      return { success: false, error: "Document not found" };
    }

    return {
      success: true,
      data: {
        path: getAbsolutePath(document.storageUrl),
        fileName: document.fileName,
        fileType: document.fileType,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to retrieve document" };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    const sessionUser = await requirePermission(PERMISSIONS.documents.delete);
    const accessUser = await getDocumentAccessUser(sessionUser.id);

    if (!id) {
      return { success: false, error: "Document ID is required" };
    }

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    if (!canAccessDocument(accessUser, document)) {
      return { success: false, error: "You do not have access to this document" };
    }

    await storage.delete(document.storageUrl);
    await prisma.document.delete({ where: { id } });

    await logActivity({
      userId: accessUser.id,
      action: "DOCUMENT_DELETED",
      entity: "Document",
      entityId: id,
      details: `Deleted document "${document.fileName}"`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to delete document" };
  }
}
