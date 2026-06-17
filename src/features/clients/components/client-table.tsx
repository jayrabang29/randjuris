"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import type { ClientWithCases } from "@/types";
import { formatDate } from "@/lib/utils";
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

type ClientTableProps = {
  clients: ClientWithCases[];
  onEdit?: (client: ClientWithCases) => void;
  pagination?: PaginationMeta;
};

export function ClientTable({ clients, onEdit, pagination }: ClientTableProps) {
  const router = useRouter();

  const columns: ColumnDef<ClientWithCases>[] = [
    {
      accessorKey: "name",
      header: "Name",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => (
        <div>
          <Link
            href={`/clients/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.firstName} {row.original.lastName}
          </Link>
          {row.original.companyName && (
            <p className="text-sm text-muted-foreground">
              {row.original.companyName}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "clientType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.clientType === "CORPORATE" ? "Corporate" : "Individual"}
        </Badge>
      ),
    },
    {
      id: "cases",
      header: "Cases",
      cell: ({ row }) => row.original._count?.cases ?? 0,
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/clients/${row.original.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Client
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={clients}
      hideSearch
      emptyMessage="No clients found."
      serverPagination={pagination}
    />
  );
}
