"use client";

import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteCategory } from "@/actions/categories";
import type { CategoryItem } from "@/actions/categories";
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

type CategoryTableProps = {
  categories: CategoryItem[];
  pagination: PaginationMeta;
  canManage: boolean;
  canDelete: boolean;
  onEdit: (category: CategoryItem) => void;
};

export function CategoryTable({
  categories,
  pagination,
  canManage,
  canDelete,
  onEdit,
}: CategoryTableProps) {
  const router = useRouter();

  async function handleDelete(category: CategoryItem) {
    const docCount = category._count?.documents ?? 0;
    if (docCount > 0) {
      alert(
        `"${category.name}" is used by ${docCount} document(s) and cannot be deleted.`
      );
      return;
    }

    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    const result = await deleteCategory(category.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to delete category");
    }
  }

  const columns: ColumnDef<CategoryItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <p className="font-medium">{row.original.name}</p>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.code}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      id: "documents",
      header: "Documents",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original._count?.documents ?? 0}</Badge>
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
                  disabled={(row.original._count?.documents ?? 0) > 0}
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
      data={categories}
      hideSearch
      emptyMessage="No categories found."
      serverPagination={pagination}
    />
  );
}
