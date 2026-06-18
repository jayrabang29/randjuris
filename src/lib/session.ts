import { auth } from "@/lib/auth";
import {
  getStaticPermissionsForRole,
  hasPermission,
} from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

function buildUserFromSession(
  sessionUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
) {
  return {
    ...sessionUser,
    permissions: getStaticPermissionsForRole(sessionUser.role),
  };
}

async function resolveSessionUser(
  sessionUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: {
        id: true,
        isActive: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      ...sessionUser,
      id: dbUser.id,
      role: dbUser.role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      name: `${dbUser.firstName} ${dbUser.lastName}`,
      permissions: getStaticPermissionsForRole(dbUser.role),
    };
  } catch {
    // Trust the JWT session when the database is slow or temporarily unavailable.
    return buildUserFromSession(sessionUser);
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user?.email || !user?.role) {
    redirect("/login");
  }

  const resolved = await resolveSessionUser(user);
  if (!resolved) {
    redirect("/login?error=session");
  }

  return resolved;
}

export async function requirePermission(permission: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission, user.permissions)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}
