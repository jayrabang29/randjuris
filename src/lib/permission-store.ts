import { UserRole } from "@prisma/client";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import {
  PAGE_ACCESS_DEFINITIONS,
  PERMISSIONS,
  SCOPE_PERMISSION_DEFINITIONS,
} from "@/lib/permissions";
import {
  seedPermissionsFromDefaults,
  syncPermissionDefinitions,
} from "@/lib/permission-seed";

async function fetchPermissionsForRole(role: UserRole): Promise<string[]> {
  await ensurePermissionsSeeded();

  const rows = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
  });

  return rows.map(
    (row) => `${row.permission.module}:${row.permission.action}`
  );
}

export async function getPermissionsForRole(
  role: UserRole
): Promise<string[]> {
  if (role === UserRole.SUPER_ADMIN) {
    return Object.values(PERMISSIONS).flatMap((module) =>
      Object.values(module)
    );
  }

  return unstable_cache(
    () => fetchPermissionsForRole(role),
    [`role-permissions-${role}`],
    { tags: ["permissions", `permissions-${role}`] }
  )();
}

export async function ensurePermissionsSeeded(): Promise<void> {
  await syncPermissionDefinitions();

  const rolePermissionCount = await prisma.rolePermission.count();
  if (rolePermissionCount === 0) {
    await seedPermissionsFromDefaults();
  }
}

export type PermissionMatrix = {
  items: Array<{
    label: string;
    description?: string;
    permission: string;
    permissionId: string;
  }>;
  roles: UserRole[];
  access: Record<string, Record<string, boolean>>;
};

export type PageAccessMatrix = PermissionMatrix & {
  pages: PermissionMatrix["items"];
};

async function buildPermissionMatrix(
  definitions: Array<{
    label: string;
    description?: string;
    permission: string;
  }>
): Promise<PermissionMatrix> {
  await ensurePermissionsSeeded();

  const permissions = await prisma.permission.findMany({
    where: {
      name: {
        in: definitions.map((item) => item.permission),
      },
    },
  });

  const permissionByName = new Map(
    permissions.map((permission) => [permission.name, permission])
  );

  const items = definitions.flatMap((definition) => {
    const permission = permissionByName.get(definition.permission);
    if (!permission) {
      return [];
    }

    return [
      {
        label: definition.label,
        description: definition.description,
        permission: definition.permission,
        permissionId: permission.id,
      },
    ];
  });

  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      permissionId: {
        in: items.map((item) => item.permissionId),
      },
    },
  });

  const access: Record<string, Record<string, boolean>> = {};

  for (const item of items) {
    access[item.permissionId] = {};
    for (const role of Object.values(UserRole)) {
      if (role === UserRole.SUPER_ADMIN) {
        access[item.permissionId][role] = true;
        continue;
      }

      access[item.permissionId][role] = rolePermissions.some(
        (entry) =>
          entry.role === role && entry.permissionId === item.permissionId
      );
    }
  }

  return {
    items,
    roles: Object.values(UserRole).filter(
      (role) => role !== UserRole.SUPER_ADMIN
    ),
    access,
  };
}

export async function getPageAccessMatrix(): Promise<PageAccessMatrix> {
  const matrix = await buildPermissionMatrix(PAGE_ACCESS_DEFINITIONS);
  return {
    ...matrix,
    pages: matrix.items,
  };
}

export async function getScopePermissionMatrix(): Promise<PermissionMatrix> {
  return buildPermissionMatrix(SCOPE_PERMISSION_DEFINITIONS);
}

export async function setPageAccess(
  role: UserRole,
  permissionId: string,
  enabled: boolean
): Promise<void> {
  if (role === UserRole.SUPER_ADMIN) {
    throw new Error("Super Admin access cannot be modified");
  }

  await ensurePermissionsSeeded();

  if (enabled) {
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
      create: {
        role,
        permissionId,
      },
      update: {},
    });
    return;
  }

  await prisma.rolePermission.deleteMany({
    where: {
      role,
      permissionId,
    },
  });
}
