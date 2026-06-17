"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  mapUserLegalServices,
  memberLegalServicesSelect,
} from "@/lib/legal-services";
import { requireAuth } from "@/lib/session";
import { updateProfileSchema, type UpdateProfileInput } from "@/validators";
import type { ActionResult } from "@/types";

export type ProfileData = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  team: { id: string; name: string } | null;
  legalServices: { id: string; name: string }[];
  createdAt: Date;
};

const profileSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
  team: { select: { id: true, name: true } },
  ...memberLegalServicesSelect,
} as const;

function mapProfile(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  team: { id: string; name: string } | null;
  legalServices: { legalService: { id: string; name: string } }[];
}): ProfileData {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    team: user.team,
    legalServices: mapUserLegalServices(user),
    createdAt: user.createdAt,
  };
}

export async function getProfile(): Promise<ActionResult<ProfileData>> {
  try {
    const sessionUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: profileSelect,
    });

    if (!user) {
      return { success: false, error: "Profile not found" };
    }

    return { success: true, data: mapProfile(user) };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function updateProfile(
  data: UpdateProfileInput
): Promise<ActionResult<ProfileData>> {
  try {
    const sessionUser = await requireAuth();

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const existing = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!existing) {
      return { success: false, error: "Profile not found" };
    }

    const emailConflict = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: sessionUser.id } },
    });

    if (emailConflict) {
      return { success: false, error: "A user with this email already exists" };
    }

    let passwordHash: string | undefined;

    if (parsed.data.newPassword) {
      const passwordValid = await bcrypt.compare(
        parsed.data.currentPassword!,
        existing.passwordHash
      );

      if (!passwordValid) {
        return { success: false, error: "Current password is incorrect" };
      }

      passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: profileSelect,
    });

    await logActivity({
      userId: sessionUser.id,
      action: "PROFILE_UPDATED",
      entity: "User",
      entityId: sessionUser.id,
      details: `Updated profile for ${user.email}`,
    });

    return { success: true, data: mapProfile(user) };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: "Failed to update profile" };
  }
}
