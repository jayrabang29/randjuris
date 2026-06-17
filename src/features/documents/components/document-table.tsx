"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, FileText, Trash2 } from "lucide-react";
import { deleteDocument } from "@/actions/documents";
import { formatDate } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/pagination";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DocumentRow = {
  id: string;
  fileName: string;
  category: { id: string; name: string; code: string };
  visibility: string;
  fileSize: number;
  fileType: string;
  createdAt: Date;
  case: { id: string; caseNumber: string; title: string };
  uploadedBy: { firstName: string; lastName: string };
  team: { id: string; name: string } | null;
};

type DocumentTableProps = {
  documents: DocumentRow[];
  pagination?: PaginationMeta;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentTable({ documents, pagination }: DocumentTableProps) {
  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    await deleteDocument(id);
    window.location.reload();
  }

  const columns: ColumnDef<DocumentRow>[] = [
    {
      accessorKey: "fileName",
      header: "File Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.fileName}</span>
        </div>
      ),
    },
    {
      id: "case",
      header: "Case",
      cell: ({ row }) => (
        <Link
          href={`/cases/${row.original.case.id}`}
          className="hover:underline"
        >
          {row.original.case.caseNumber}
        </Link>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.category.name}</Badge>
      ),
    },
    {
      accessorKey: "visibility",
      header: "Access",
      cell: ({ row }) => (
        <Badge
          variant={row.original.visibility === "TEAM" ? "secondary" : "outline"}
        >
          {row.original.visibility === "TEAM"
            ? row.original.team?.name
              ? `Team — ${row.original.team.name}`
              : "Team only"
            : "General"}
        </Badge>
      ),
    },
    {
      accessorKey: "fileSize",
      header: "Size",
      cell: ({ row }) => formatFileSize(row.original.fileSize),
    },
    {
      id: "uploadedBy",
      header: "Uploaded By",
      cell: ({ row }) =>
        `${row.original.uploadedBy.firstName} ${row.original.uploadedBy.lastName}`,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <a
              href={`/api/documents/${row.original.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={`/api/documents/${row.original.id}/download`}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={documents}
      searchKey="fileName"
      searchPlaceholder="Search documents..."
      emptyMessage="No documents found."
      serverPagination={pagination}
    />
  );
}
