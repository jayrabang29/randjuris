"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import type { UserListItem } from "@/actions/users";
import type { TeamOption } from "@/actions/teams";
import type { LegalServiceOption } from "@/actions/legal-services";
import type { PaginationMeta } from "@/lib/pagination";
import { usePermissions } from "@/components/providers/permissions-provider";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { UserFilters } from "@/features/users/components/user-filters";
import { UserForm } from "@/features/users/components/user-form";
import { UserTable } from "@/features/users/components/user-table";

type UsersPageContentProps = {
  users: UserListItem[];
  pagination: PaginationMeta;
  currentUserId: string;
  teams: TeamOption[];
  legalServices: LegalServiceOption[];
};

export function UsersPageContent({
  users,
  pagination,
  currentUserId,
  teams,
  legalServices,
}: UsersPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  const { can, role } = usePermissions();
  const canCreate = can(PERMISSIONS.users.create);
  const canManageUsers = can(PERMISSIONS.users.update);
  const canAssignSuperAdmin = role === "SUPER_ADMIN";
  const formOpen = createOpen || !!editingUser;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingUser(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage firm staff accounts and access roles"
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingUser(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6">
        <Suspense fallback={<LoadingSpinner />}>
          <UserFilters />
        </Suspense>
      </div>

      <UserTable
        users={users}
        pagination={pagination}
        currentUserId={currentUserId}
        canManageUsers={canManageUsers}
        onEdit={(user) => {
          setCreateOpen(false);
          setEditingUser(user);
        }}
      />

      <UserForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        user={editingUser ?? undefined}
        canAssignSuperAdmin={canAssignSuperAdmin}
        teams={teams}
        legalServices={legalServices}
      />
    </>
  );
}
