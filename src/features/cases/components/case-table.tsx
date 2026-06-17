"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { CaseInput } from "@/validators";
import type { PaginationMeta } from "@/lib/pagination";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CaseRow = {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  visibility: string;
  courtName: string | null;
  filingDate: Date | null;
  clientId: string;
  updatedAt: Date;
  client: { firstName: string; lastName: string };
  assignments: {
    user: { firstName: string; lastName: string };
    isLead: boolean;
  }[];
};

function toCaseInput(caseRow: CaseRow): CaseInput & { id: string } {
  return {
    id: caseRow.id,
    caseNumber: caseRow.caseNumber,
    title: caseRow.title,
    description: caseRow.description,
    category: caseRow.category as CaseInput["category"],
    courtName: caseRow.courtName,
    filingDate: caseRow.filingDate
      ? new Date(caseRow.filingDate).toISOString().split("T")[0]
      : null,
    status: caseRow.status as CaseInput["status"],
    visibility: caseRow.visibility as CaseInput["visibility"],
    clientId: caseRow.clientId,
  };
}

type CaseTableProps = {
  cases: CaseRow[];
  onEdit?: (caseData: CaseInput & { id: string }) => void;
  pagination?: PaginationMeta;
};

export function CaseTable({ cases, onEdit, pagination }: CaseTableProps) {
  const router = useRouter();

  const columns: ColumnDef<CaseRow>[] = [
    {
      accessorKey: "caseNumber",
      header: "Case #",
      cell: ({ row }) => (
        <Link
          href={`/cases/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.caseNumber}
        </Link>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) =>
        `${row.original.client.firstName} ${row.original.client.lastName}`,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.category.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} type="case" />
      ),
    },
    {
      accessorKey: "visibility",
      header: "Access",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.visibility === "TEAM" ? "Team" : "General"}
        </Badge>
      ),
    },
    {
      id: "lawyers",
      header: "Assigned",
      cell: ({ row }) => {
        const lead = row.original.assignments.find((a) => a.isLead);
        const lawyer = lead ?? row.original.assignments[0];
        return lawyer
          ? `${lawyer.user.firstName} ${lawyer.user.lastName}`
          : "—";
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => formatDate(row.original.updatedAt),
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
              onClick={() => router.push(`/cases/${row.original.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(toCaseInput(row.original))}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Case
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
      data={cases}
      searchKey="title"
      searchPlaceholder="Search cases..."
      emptyMessage="No cases found."
      serverPagination={pagination}
    />
  );
}
