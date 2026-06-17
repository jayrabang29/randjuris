import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  type PermissionModule,
} from "@/lib/permissions";

export async function seedPermissionsFromDefaults(): Promise<void> {
  for (const modulePermissions of Object.values(PERMISSIONS)) {
    for (const permissionName of Object.values(modulePermissions)) {
      const [module, action] = permissionName.split(":") as [
        PermissionModule,
        string,
      ];

      await prisma.permission.upsert({
        where: { name: permissionName },
        create: {
          name: permissionName,
          module,
          action,
          description: `${module} ${action}`,
        },
        update: {
          module,
          action,
        },
      });
    }
  }

  for (const [role, permissionNames] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS
  )) {
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: role as UserRole,
            permissionId: permission.id,
          },
        },
        create: {
          role: role as UserRole,
          permissionId: permission.id,
        },
        update: {},
      });
    }
  }
}

export async function syncPermissionDefinitions(): Promise<void> {
  for (const modulePermissions of Object.values(PERMISSIONS)) {
    for (const permissionName of Object.values(modulePermissions)) {
      const [module, action] = permissionName.split(":") as [
        PermissionModule,
        string,
      ];

      await prisma.permission.upsert({
        where: { name: permissionName },
        create: {
          name: permissionName,
          module,
          action,
          description: `${module} ${action}`,
        },
        update: {
          module,
          action,
        },
      });
    }
  }
}
