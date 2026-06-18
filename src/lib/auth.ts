import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getPermissionsForRole } from "@/lib/permission-store";
import { getStaticPermissionsForRole } from "@/lib/permissions";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      name: string;
      permissions: string[];
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    firstName: string;
    lastName: string;
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    permissions?: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as never,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        await logActivity({
          userId: user.id,
          action: "USER_LOGIN",
          entity: "User",
          entityId: user.id,
          details: `User ${user.email} logged in`,
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          name: `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email!;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;

        try {
          token.permissions = await getPermissionsForRole(user.role);
        } catch {
          token.permissions = getStaticPermissionsForRole(user.role);
        }
      } else if (
        (!Array.isArray(token.permissions) || token.permissions.length === 0) &&
        token.role
      ) {
        token.permissions = getStaticPermissionsForRole(
          token.role as UserRole
        );
      }

      return token;
    },
  },
});
