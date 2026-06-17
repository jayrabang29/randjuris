"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckSquare,
  ChevronDown,
  DollarSign,
  FileText,
  FolderTree,
  LayoutDashboard,
  ScrollText,
  Scale,
  Settings2,
  Shield,
  User,
  UserCog,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";
import { cn } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";
import { usePermissions } from "@/components/providers/permissions-provider";
import { Button } from "@/components/ui/button";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
};

type NavGroup = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.dashboard.read,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    permission: PERMISSIONS.clients.read,
  },
  {
    title: "Cases",
    href: "/cases",
    icon: Briefcase,
    permission: PERMISSIONS.cases.read,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    permission: PERMISSIONS.documents.read,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    permission: PERMISSIONS.tasks.read,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    permission: PERMISSIONS.calendar.read,
  },
  {
    title: "Billing",
    href: "/billing",
    icon: DollarSign,
    permission: PERMISSIONS.billing.read,
  },
  {
    title: "Users",
    href: "/users",
    icon: UserCog,
    permission: PERMISSIONS.users.read,
  },
  {
    title: "Team",
    href: "/team",
    icon: UsersRound,
    permission: PERMISSIONS.teams.read,
  },
];

const PROFILE_ITEM: NavItem = {
  title: "Profile",
  href: "/profile",
  icon: User,
  permission: "",
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Settings",
    icon: Settings2,
    children: [
      {
        title: "Activity Logs",
        href: "/activity-logs",
        icon: ScrollText,
        permission: PERMISSIONS.activity_logs.read,
      },
      {
        title: "Legal Services",
        href: "/legal-services",
        icon: Scale,
        permission: PERMISSIONS.legal_services.read,
      },
      {
        title: "Categories",
        href: "/categories",
        icon: FolderTree,
        permission: PERMISSIONS.categories.read,
      },
      {
        title: "Permissions",
        href: "/permissions",
        icon: Shield,
        permission: PERMISSIONS.settings.manage,
      },
    ],
  },
];

type SidebarProps = {
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
};

function NavLink({
  item,
  pathname,
  onNavigate,
  nested = false,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg py-2.5 text-[13px] font-medium transition-all duration-200",
        nested ? "px-3 pl-9" : "px-3",
        isActive
          ? "nav-pill-active"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive
            ? "text-gold"
            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
        )}
      />
      {item.title}
    </Link>
  );
}

export function Sidebar({
  onNavigate,
  onClose,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        children: group.children.filter((child) => can(child.permission)),
      })).filter((group) => group.children.length > 0),
    [can]
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current };
      for (const group of visibleGroups) {
        const isGroupActive = group.children.some(
          (child) =>
            pathname === child.href || pathname.startsWith(`${child.href}/`)
        );
        if (isGroupActive) {
          next[group.title] = true;
        } else if (next[group.title] === undefined) {
          next[group.title] = false;
        }
      }
      return next;
    });
  }, [pathname, visibleGroups]);

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] flex-col bg-sidebar text-sidebar-foreground shadow-sidebar",
        className
      )}
    >
      <div className="flex h-[4.25rem] items-center justify-between border-b border-sidebar-border/60 px-5">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
          onClick={onNavigate}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 shadow-glow">
            <Scale className="h-5 w-5 text-sidebar-primary-foreground" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-sidebar" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
              {APP_NAME}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
              {APP_TAGLINE}
            </span>
          </div>
        </Link>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Main Menu
        </p>

        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}

        <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Account
        </p>
        <NavLink
          item={PROFILE_ITEM}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        {visibleGroups.length > 0 && (
          <>
            <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Settings
            </p>
            {visibleGroups.map((group) => {
              const isOpen = openGroups[group.title] ?? false;
              const isGroupActive = group.children.some(
                (child) =>
                  pathname === child.href ||
                  pathname.startsWith(`${child.href}/`)
              );
              const GroupIcon = group.icon;

              return (
                <div key={group.title} className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((current) => ({
                        ...current,
                        [group.title]: !isOpen,
                      }))
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                      isGroupActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <GroupIcon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isGroupActive
                            ? "text-gold"
                            : "text-sidebar-foreground/50"
                        )}
                      />
                      {group.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="space-y-1">
                      {group.children.map((child) => (
                        <NavLink
                          key={child.href}
                          item={child}
                          pathname={pathname}
                          onNavigate={onNavigate}
                          nested
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border/60 p-4">
        <div className="rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <p className="text-[11px] font-medium text-sidebar-foreground/70">
            Enterprise Edition
          </p>
          <p className="mt-0.5 text-[10px] text-sidebar-foreground/40">
            v1.0 · Secure & Compliant
          </p>
        </div>
      </div>
    </aside>
  );
}
