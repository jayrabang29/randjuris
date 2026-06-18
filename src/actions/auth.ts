"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn, signOut } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeCallbackUrl } from "@/lib/url";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  type LoginInput,
} from "@/validators";
import type { ActionResult } from "@/types";

export async function login(
  data: LoginInput,
  callbackUrl?: string
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const redirectTo = normalizeCallbackUrl(callbackUrl ?? "/dashboard");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }

    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Can't reach database") ||
      message.includes("connect") ||
      message.includes("P1001") ||
      message.includes("P1002") ||
      message.includes("P1017")
    ) {
      return {
        success: false,
        error:
          "Cannot reach the database from the server. Check DATABASE_URL on Vercel and allow remote MySQL connections.",
      };
    }

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function logout(): Promise<ActionResult> {
  const user = await getCurrentUser();

  await signOut({ redirect: false });

  if (user) {
    await logActivity({
      userId: user.id,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: user.id,
      details: `User ${user.email} logged out`,
    });
  }

  return { success: true };
}

export async function forgotPassword(email: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (user && user.isActive) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expires,
        },
      });

      await logActivity({
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "User",
        entityId: user.id,
        details: `Password reset requested for ${user.email}`,
      });
    }

    return {
      success: true,
      data: undefined,
    };
  } catch {
    return { success: false, error: "Failed to process password reset request" };
  }
}

export async function resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: parsed.data.token },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.used ||
      resetToken.expires < new Date() ||
      !resetToken.user.isActive
    ) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await logActivity({
      userId: resetToken.userId,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: resetToken.userId,
      details: `Password reset completed for ${resetToken.user.email}`,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to reset password" };
  }
}
