"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, UserCheck, UserX } from "lucide-react";
import { UserRole } from "@prisma/client";
import { toggleUserActive } from "@/actions/users";
import type { UserListItem } from "@/actions/users";
import { formatDate } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/pagination";
import { ROLE_LABELS } from "@/lib/permissions";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserTableProps = {
  users: UserListItem[];
  pagination: PaginationMeta;
  currentUserId: string;
  canManageUsers: boolean;
  onEdit: (user: UserListItem) => void;
};

export function UserTable({
  users,
  pagination,
  currentUserId,
  canManageUsers,
  onEdit,
}: UserTableProps) {
  const router = useRouter();

  async function handleToggleActive(user: UserListItem) {
    const action = user.isActive ? "deactivate" : "activate";
    if (
      !confirm(
        `${action === "deactivate" ? "Deactivate" : "Activate"} ${user.firstName} ${user.lastName}?`
      )
    ) {
      return;
    }

    const result = await toggleUserActive(user.id, !user.isActive);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to update user status");
    }
  }

  const columns: ColumnDef<UserListItem>[] = [
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.firstName} {row.original.lastName}
            {row.original.id === currentUserId && (
              <span className="ml-2 text-xs text-muted-foreground">(You)</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline">
          {ROLE_LABELS[row.original.role as UserRole]}
        </Badge>
      ),
    },
    {
      id: "team",
      header: "Team",
      cell: ({ row }) => row.original.team?.name ?? "—",
    },
    {
      id: "legalServices",
      header: "Legal Services",
      cell: ({ row }) =>
        row.original.legalServices.length > 0
          ? row.original.legalServices.map((service) => service.name).join(", ")
          : "—",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId;
        const isSuperAdmin = row.original.role === "SUPER_ADMIN";

        if (!canManageUsers) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              {!isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleToggleActive(row.original)}
                    disabled={isSuperAdmin && row.original.isActive}
                  >
                    {row.original.isActive ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      hideSearch
      emptyMessage="No users found."
      serverPagination={pagination}
    />
  );
}
