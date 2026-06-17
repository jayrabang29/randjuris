"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizePathname } from "@/lib/url";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Clients",
  cases: "Cases",
  documents: "Documents",
  tasks: "Tasks",
  calendar: "Calendar",
  billing: "Billing",
  profile: "Profile",
  "activity-logs": "Activity Logs",
  settings: "Settings",
  users: "Users",
  new: "New",
  edit: "Edit",
};

function formatSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type BreadcrumbsProps = {
  className?: string;
};

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = normalizePathname(usePathname());
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-[13px] text-muted-foreground",
        className
      )}
    >
      <Link
        href="/dashboard"
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Dashboard</span>
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center">
          <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-semibold text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
