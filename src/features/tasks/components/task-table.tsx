"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TaskInput } from "@/validators";
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

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  visibility: string;
  dueDate: Date | null;
  caseId: string | null;
  assigneeId: string | null;
  case: { caseNumber: string; title: string } | null;
  assignee: { firstName: string; lastName: string } | null;
};

function toTaskInput(task: TaskRow): TaskInput & { id: string } {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskInput["status"],
    priority: task.priority as TaskInput["priority"],
    visibility: task.visibility as TaskInput["visibility"],
    dueDate: task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : null,
    caseId: task.caseId,
    assigneeId: task.assigneeId,
  };
}

type TaskTableProps = {
  tasks: TaskRow[];
  onEdit?: (task: TaskInput & { id: string }) => void;
  pagination?: PaginationMeta;
};

export function TaskTable({ tasks, onEdit, pagination }: TaskTableProps) {
  const columns: ColumnDef<TaskRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: "case",
      header: "Case",
      cell: ({ row }) =>
        row.original.case ? (
          <span>{row.original.case.caseNumber}</span>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} type="task" />
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.priority}</Badge>
      ),
    },
    {
      id: "access",
      header: "Access",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.visibility === "TEAM" ? "Team" : "General"}
        </Badge>
      ),
    },
    {
      id: "assignee",
      header: "Assignee",
      cell: ({ row }) =>
        row.original.assignee
          ? `${row.original.assignee.firstName} ${row.original.assignee.lastName}`
          : "Unassigned",
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) =>
        row.original.dueDate ? formatDate(row.original.dueDate) : "—",
    },
    {
      id: "actions",
      cell: ({ row }) =>
        onEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(toTaskInput(row.original))}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={tasks}
      searchKey="title"
      searchPlaceholder="Search tasks..."
      emptyMessage="No tasks found."
      serverPagination={pagination}
    />
  );
}
