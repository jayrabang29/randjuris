"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteLegalService } from "@/actions/legal-services";
import type { LegalServiceItem } from "@/actions/legal-services";
import type { PaginationMeta } from "@/lib/pagination";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LegalServiceTableProps = {
  services: LegalServiceItem[];
  pagination: PaginationMeta;
  canManage: boolean;
  canDelete: boolean;
  onEdit: (service: LegalServiceItem) => void;
};

export function LegalServiceTable({
  services,
  pagination,
  canManage,
  canDelete,
  onEdit,
}: LegalServiceTableProps) {
  const router = useRouter();

  async function handleDelete(service: LegalServiceItem) {
    const assignedCount = service._count?.users ?? 0;
    const warning =
      assignedCount > 0
        ? ` This will remove the service from ${assignedCount} assigned user(s).`
        : "";

    if (
      !confirm(
        `Delete "${service.name}"?${warning} This action cannot be undone.`
      )
    ) {
      return;
    }

    const result = await deleteLegalService(service.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to delete legal service");
    }
  }

  const columns: ColumnDef<LegalServiceItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <p className="font-medium">{row.original.name}</p>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      id: "assignedUsers",
      header: "Assigned Users",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original._count?.users ?? 0}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (!canManage && !canDelete) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManage && (
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(row.original)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
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
      data={services}
      hideSearch
      emptyMessage="No legal services found."
      serverPagination={pagination}
    />
  );
}
