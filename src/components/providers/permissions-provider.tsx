"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { UserRole } from "@prisma/client";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";

type PermissionsContextValue = {
  role: UserRole;
  permissions: string[];
  can: (permission: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

type PermissionsProviderProps = {
  role: UserRole;
  permissions: string[];
  children: React.ReactNode;
};

export function PermissionsProvider({
  role,
  permissions,
  children,
}: PermissionsProviderProps) {
  const can = useCallback(
    (permission: string) => {
      if (isSuperAdmin(role)) {
        return true;
      }
      return hasPermission(role, permission, permissions);
    },
    [role, permissions]
  );

  const value = useMemo(
    () => ({
      role,
      permissions,
      can,
    }),
    [role, permissions, can]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return context;
}
