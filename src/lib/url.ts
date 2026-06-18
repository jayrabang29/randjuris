/**
 * Strip legacy index.php segments from paths and base URLs.
 * Common when the app is accessed through Apache/PHP-style rewrite rules.
 */
export function normalizePathname(pathname: string): string {
  let path = pathname.replace(/\/index\.php/gi, "");

  if (!path || path === "") {
    path = "/";
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  // Collapse duplicate slashes (except protocol-relative URLs)
  path = path.replace(/\/{2,}/g, "/");

  // Remove trailing slash except for root
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return path;
}

export function normalizeCallbackUrl(url: string): string {
  if (!url) return "/dashboard";

  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      return normalizePathname(parsed.pathname + parsed.search + parsed.hash);
    }
  } catch {
    return "/dashboard";
  }

  return normalizePathname(url.split("?")[0]) + (url.includes("?") ? url.slice(url.indexOf("?")) : "");
}

export function getBaseUrl(): string {
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (authUrl && !authUrl.includes("localhost")) {
    return authUrl
      .replace(/\/index\.php\/?$/i, "")
      .replace(/\/index\.php\//gi, "/")
      .replace(/\/+$/, "");
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000"
  );
}

export function buildAppUrl(path: string): string {
  const base = getBaseUrl();
  const normalizedPath = normalizePathname(path);
  return `${base}${normalizedPath === "/" ? "" : normalizedPath}`;
}
