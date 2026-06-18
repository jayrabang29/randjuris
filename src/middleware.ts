import { auth } from "@/lib/auth.edge";
import { canAccessRoute } from "@/lib/permissions";
import { normalizePathname } from "@/lib/url";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

// Keep env vars in the middleware bundle (required on Vercel Edge).
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
void authSecret;

const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
const authRoutes = ["/login", "/forgot-password", "/reset-password"];

function hasUsableSession(session: Session | null): boolean {
  return Boolean(session?.user?.email && session?.user?.role);
}

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = hasUsableSession(session);
  const rawPathname = nextUrl.pathname;
  const pathname = normalizePathname(rawPathname);

  if (rawPathname !== pathname) {
    const cleanUrl = new URL(pathname + nextUrl.search, nextUrl);
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
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  if (isLoggedIn && session?.user?.role) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    const permissions = session.user.permissions;

    if (!canAccessRoute(session.user.role, pathname, permissions)) {
      return NextResponse.redirect(
        new URL("/dashboard?error=unauthorized", nextUrl)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
