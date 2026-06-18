import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";
import { getStaticPermissionsForRole } from "@/lib/permissions";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email!;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.name = `${token.firstName} ${token.lastName}`;
        session.user.permissions = getStaticPermissionsForRole(
          token.role as UserRole
        );
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
