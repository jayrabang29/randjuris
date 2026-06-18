import { UserRole } from "@prisma/client";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage";

export type PermissionModule =
  | "dashboard"
  | "clients"
  | "cases"
  | "documents"
  | "tasks"
  | "calendar"
  | "billing"
  | "users"
  | "teams"
  | "legal_services"
  | "categories"
  | "settings"
  | "activity_logs";

export const PERMISSIONS: Record<
  PermissionModule,
  Record<PermissionAction, string>
> = {
  dashboard: {
    create: "dashboard:create",
    read: "dashboard:read",
    update: "dashboard:update",
    delete: "dashboard:delete",
    manage: "dashboard:manage",
  },
  clients: {
    create: "clients:create",
    read: "clients:read",
    update: "clients:update",
    delete: "clients:delete",
    manage: "clients:manage",
  },
  cases: {
    create: "cases:create",
    read: "cases:read",
    update: "cases:update",
    delete: "cases:delete",
    manage: "cases:manage",
  },
  documents: {
    create: "documents:create",
    read: "documents:read",
    update: "documents:update",
    delete: "documents:delete",
    manage: "documents:manage",
  },
  tasks: {
    create: "tasks:create",
    read: "tasks:read",
    update: "tasks:update",
    delete: "tasks:delete",
    manage: "tasks:manage",
  },
  calendar: {
    create: "calendar:create",
    read: "calendar:read",
    update: "calendar:update",
    delete: "calendar:delete",
    manage: "calendar:manage",
  },
  billing: {
    create: "billing:create",
    read: "billing:read",
    update: "billing:update",
    delete: "billing:delete",
    manage: "billing:manage",
  },
  users: {
    create: "users:create",
    read: "users:read",
    update: "users:update",
    delete: "users:delete",
    manage: "users:manage",
  },
  teams: {
    create: "teams:create",
    read: "teams:read",
    update: "teams:update",
    delete: "teams:delete",
    manage: "teams:manage",
  },
  legal_services: {
    create: "legal_services:create",
    read: "legal_services:read",
    update: "legal_services:update",
    delete: "legal_services:delete",
    manage: "legal_services:manage",
  },
  categories: {
    create: "categories:create",
    read: "categories:read",
    update: "categories:update",
    delete: "categories:delete",
    manage: "categories:manage",
  },
  settings: {
    create: "settings:create",
    read: "settings:read",
    update: "settings:update",
    delete: "settings:delete",
    manage: "settings:manage",
  },
  activity_logs: {
    create: "activity_logs:create",
    read: "activity_logs:read",
    update: "activity_logs:update",
    delete: "activity_logs:delete",
    manage: "activity_logs:manage",
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS).flatMap((m) => Object.values(m)),

  MANAGING_PARTNER: [
    ...Object.values(PERMISSIONS.dashboard),
    ...Object.values(PERMISSIONS.clients),
    PERMISSIONS.cases.read,
    PERMISSIONS.cases.create,
    PERMISSIONS.cases.update,
    PERMISSIONS.cases.delete,
    ...Object.values(PERMISSIONS.documents),
    ...Object.values(PERMISSIONS.tasks),
    ...Object.values(PERMISSIONS.calendar),
    PERMISSIONS.billing.read,
    PERMISSIONS.billing.create,
    PERMISSIONS.billing.update,
    PERMISSIONS.billing.delete,
    PERMISSIONS.users.read,
    PERMISSIONS.users.create,
    PERMISSIONS.users.update,
    PERMISSIONS.teams.read,
    PERMISSIONS.teams.create,
    PERMISSIONS.teams.update,
    PERMISSIONS.teams.delete,
    PERMISSIONS.legal_services.read,
    PERMISSIONS.legal_services.create,
    PERMISSIONS.legal_services.update,
    PERMISSIONS.legal_services.delete,
    PERMISSIONS.categories.read,
    PERMISSIONS.categories.create,
    PERMISSIONS.categories.update,
    PERMISSIONS.categories.delete,
    PERMISSIONS.activity_logs.read,
    PERMISSIONS.settings.read,
  ],

  LAWYER: [
    PERMISSIONS.dashboard.read,
    PERMISSIONS.clients.read,
    PERMISSIONS.clients.create,
    PERMISSIONS.clients.update,
    PERMISSIONS.cases.read,
    PERMISSIONS.cases.create,
    PERMISSIONS.cases.update,
    PERMISSIONS.documents.read,
    PERMISSIONS.documents.create,
    PERMISSIONS.documents.update,
    PERMISSIONS.tasks.read,
    PERMISSIONS.tasks.create,
    PERMISSIONS.tasks.update,
    PERMISSIONS.calendar.read,
    PERMISSIONS.calendar.create,
    PERMISSIONS.calendar.update,
    PERMISSIONS.billing.read,
    PERMISSIONS.billing.create,
  ],

  PARALEGAL: [
    PERMISSIONS.dashboard.read,
    PERMISSIONS.clients.read,
    PERMISSIONS.cases.read,
    PERMISSIONS.cases.update,
    PERMISSIONS.documents.read,
    PERMISSIONS.documents.create,
    PERMISSIONS.documents.update,
    PERMISSIONS.tasks.read,
    PERMISSIONS.tasks.create,
    PERMISSIONS.tasks.update,
    PERMISSIONS.calendar.read,
    PERMISSIONS.calendar.create,
    PERMISSIONS.calendar.update,
  ],

  SECRETARY: [
    PERMISSIONS.dashboard.read,
    PERMISSIONS.clients.read,
    PERMISSIONS.clients.create,
    PERMISSIONS.clients.update,
    PERMISSIONS.cases.read,
    PERMISSIONS.calendar.read,
    PERMISSIONS.calendar.create,
    PERMISSIONS.calendar.update,
    PERMISSIONS.tasks.read,
    PERMISSIONS.tasks.create,
  ],

  ACCOUNTANT: [
    PERMISSIONS.dashboard.read,
    PERMISSIONS.clients.read,
    PERMISSIONS.cases.read,
    PERMISSIONS.billing.read,
    PERMISSIONS.billing.create,
    PERMISSIONS.billing.update,
  ],

  CLIENT: [
    PERMISSIONS.dashboard.read,
    PERMISSIONS.cases.read,
    PERMISSIONS.documents.read,
    PERMISSIONS.billing.read,
  ],
};

export type PageAccessDefinition = {
  label: string;
  route: string;
  permission: string;
  module: PermissionModule;
  action: "read" | "manage";
};

export type ScopePermissionDefinition = {
  label: string;
  description: string;
  permission: string;
  module: PermissionModule;
  action: PermissionAction;
};

export const SCOPE_PERMISSION_DEFINITIONS: ScopePermissionDefinition[] = [
  {
    label: "View All Cases",
    description:
      "View every case in the firm. Without this, users only see general cases, their team's cases, and cases they created or are assigned to.",
    permission: PERMISSIONS.cases.manage,
    module: "cases",
    action: "manage",
  },
  {
    label: "View All Billing",
    description:
      "View firm-wide invoices and time entries. Without this, users only see their team's billing.",
    permission: PERMISSIONS.billing.manage,
    module: "billing",
    action: "manage",
  },
];

export const PAGE_ACCESS_DEFINITIONS: PageAccessDefinition[] = [
  {
    label: "Dashboard",
    route: "/dashboard",
    permission: PERMISSIONS.dashboard.read,
    module: "dashboard",
    action: "read",
  },
  {
    label: "Clients",
    route: "/clients",
    permission: PERMISSIONS.clients.read,
    module: "clients",
    action: "read",
  },
  {
    label: "Cases",
    route: "/cases",
    permission: PERMISSIONS.cases.read,
    module: "cases",
    action: "read",
  },
  {
    label: "Documents",
    route: "/documents",
    permission: PERMISSIONS.documents.read,
    module: "documents",
    action: "read",
  },
  {
    label: "Tasks",
    route: "/tasks",
    permission: PERMISSIONS.tasks.read,
    module: "tasks",
    action: "read",
  },
  {
    label: "Calendar",
    route: "/calendar",
    permission: PERMISSIONS.calendar.read,
    module: "calendar",
    action: "read",
  },
  {
    label: "Billing",
    route: "/billing",
    permission: PERMISSIONS.billing.read,
    module: "billing",
    action: "read",
  },
  {
    label: "Users",
    route: "/users",
    permission: PERMISSIONS.users.read,
    module: "users",
    action: "read",
  },
  {
    label: "Team",
    route: "/team",
    permission: PERMISSIONS.teams.read,
    module: "teams",
    action: "read",
  },
  {
    label: "Activity Logs",
    route: "/activity-logs",
    permission: PERMISSIONS.activity_logs.read,
    module: "activity_logs",
    action: "read",
  },
  {
    label: "Legal Services",
    route: "/legal-services",
    permission: PERMISSIONS.legal_services.read,
    module: "legal_services",
    action: "read",
  },
  {
    label: "Categories",
    route: "/categories",
    permission: PERMISSIONS.categories.read,
    module: "categories",
    action: "read",
  },
  {
    label: "Permissions",
    route: "/permissions",
    permission: PERMISSIONS.settings.manage,
    module: "settings",
    action: "manage",
  },
];

export const EDITABLE_ROLES: UserRole[] = [
  UserRole.MANAGING_PARTNER,
  UserRole.LAWYER,
  UserRole.PARALEGAL,
  UserRole.SECRETARY,
  UserRole.ACCOUNTANT,
  UserRole.CLIENT,
];

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function getStaticPermissionsForRole(role: UserRole): string[] {
  if (isSuperAdmin(role)) {
    return Object.values(PERMISSIONS).flatMap((module) =>
      Object.values(module)
    );
  }

  return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermissionInList(
  permissions: string[],
  permission: string
): boolean {
  return permissions.includes(permission);
}

export function hasPermission(
  role: UserRole,
  permission: string,
  permissions?: string[]
): boolean {
  if (isSuperAdmin(role)) {
    return true;
  }

  const list =
    permissions && permissions.length > 0
      ? permissions
      : (DEFAULT_ROLE_PERMISSIONS[role] ?? []);
  return list.includes(permission);
}

export function hasAnyPermission(
  role: UserRole,
  permissionsToCheck: string[],
  permissions?: string[]
): boolean {
  return permissionsToCheck.some((p) =>
    hasPermission(role, p, permissions)
  );
}

export function canAccessRoute(
  role: UserRole,
  route: string,
  permissions?: string[]
): boolean {
  if (isSuperAdmin(role)) {
    return true;
  }

  const routePermissions: Record<string, string> = {
    "/dashboard": PERMISSIONS.dashboard.read,
    "/clients": PERMISSIONS.clients.read,
    "/cases": PERMISSIONS.cases.read,
    "/documents": PERMISSIONS.documents.read,
    "/tasks": PERMISSIONS.tasks.read,
    "/calendar": PERMISSIONS.calendar.read,
    "/billing": PERMISSIONS.billing.read,
    "/users": PERMISSIONS.users.read,
    "/team": PERMISSIONS.teams.read,
    "/legal-services": PERMISSIONS.legal_services.read,
    "/categories": PERMISSIONS.categories.read,
    "/activity-logs": PERMISSIONS.activity_logs.read,
    "/permissions": PERMISSIONS.settings.manage,
  };

  for (const [prefix, permission] of Object.entries(routePermissions)) {
    if (route.startsWith(prefix)) {
      return hasPermission(role, permission, permissions);
    }
  }

  return true;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGING_PARTNER: "Managing Partner",
  LAWYER: "Lawyer",
  PARALEGAL: "Paralegal",
  SECRETARY: "Secretary",
  ACCOUNTANT: "Accountant",
  CLIENT: "Client",
};
