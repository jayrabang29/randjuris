import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";
import { getStaticPermissionsForRole } from "@/lib/permissions";

const useSecureCookies =
  process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [],
  callbacks: {
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
