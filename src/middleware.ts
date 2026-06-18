import { getToken } from "next-auth/jwt";
import { UserRole } from "@prisma/client";
import { canAccessRoute, getStaticPermissionsForRole } from "@/lib/permissions";
import { normalizePathname } from "@/lib/url";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Bundle secrets for Vercel Edge.
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
void authSecret;

const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
const authRoutes = ["/login", "/forgot-password", "/reset-password"];

type AuthToken = {
  email?: string;
  role?: UserRole;
};

function resolveSecureCookie(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? req.nextUrl.protocol.replace(":", "");
  return protocol === "https";
}

export async function middleware(req: NextRequest) {
  const secureCookie = resolveSecureCookie(req);

  const token = (await getToken({
    req,
    secret: authSecret,
    secureCookie,
  })) as AuthToken | null;

  const isLoggedIn = Boolean(token?.email && token?.role);
  const rawPathname = req.nextUrl.pathname;
  const pathname = normalizePathname(rawPathname);

  if (rawPathname !== pathname) {
    const cleanUrl = new URL(pathname + req.nextUrl.search, req.nextUrl);
    return NextResponse.redirect(cleanUrl, 308);
  }

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isHealthRoute = pathname === "/api/health";

  if (isApiAuthRoute || isHealthRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl)
    );
  }

  if (isLoggedIn && token?.role) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    const permissions = getStaticPermissionsForRole(token.role);

    if (!canAccessRoute(token.role, pathname, permissions)) {
      return NextResponse.redirect(
        new URL("/dashboard?error=unauthorized", req.nextUrl)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
