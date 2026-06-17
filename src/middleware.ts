import { auth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/permissions";
import { normalizePathname } from "@/lib/url";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
const authRoutes = ["/login", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const rawPathname = nextUrl.pathname;
  const pathname = normalizePathname(rawPathname);

  // Redirect legacy index.php URLs to clean paths
  if (rawPathname !== pathname) {
    const cleanUrl = new URL(pathname + nextUrl.search, nextUrl);
    return NextResponse.redirect(cleanUrl, 308);
  }

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isApiAuthRoute = pathname.startsWith("/api/auth");

  if (isApiAuthRoute) {
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

  if (isLoggedIn && req.auth?.user?.role) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    const permissions = req.auth.user.permissions;

    if (!canAccessRoute(req.auth.user.role, pathname, permissions)) {
      return NextResponse.redirect(
        new URL("/dashboard?error=unauthorized", nextUrl)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
