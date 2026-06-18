import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Direct process.env access is required so Vercel/Edge bundles this variable.
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { auth } = NextAuth({
  ...authConfig,
  secret,
});
