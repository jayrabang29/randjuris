"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { logActivity } from "@/lib/activity";
import {
  getPageAccessMatrix,
  getScopePermissionMatrix,
  setPageAccess,
  type PageAccessMatrix,
  type PermissionMatrix,
} from "@/lib/permission-store";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import type { ActionResult } from "@/types";

export async function getPermissionsMatrix(): Promise<
  ActionResult<{
    pages: PageAccessMatrix;
    scopes: PermissionMatrix;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.settings.manage);

    const [pages, scopes] = await Promise.all([
      getPageAccessMatrix(),
      getScopePermissionMatrix(),
    ]);

    return { success: true, data: { pages, scopes } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to load permissions" };
  }
}

export async function updatePageAccess(
  role: UserRole,
  permissionId: string,
  enabled: boolean
): Promise<ActionResult> {
  try {
    const actor = await requirePermission(PERMISSIONS.settings.manage);

    await setPageAccess(role, permissionId, enabled);

    revalidateTag("permissions");
    revalidateTag(`permissions-${role}`);

    await logActivity({
      userId: actor.id,
      action: "PERMISSION_UPDATED",
      entity: "RolePermission",
      entityId: `${role}:${permissionId}`,
      details: `${enabled ? "Granted" : "Revoked"} page access for ${role}`,
    });

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update permission" };
  }
}
