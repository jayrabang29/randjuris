"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateTask } from "@/actions/tasks";
import { formatDate } from "@/lib/utils";
import type { TaskInput } from "@/validators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  case: { caseNumber: string } | null;
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

type TaskBoardProps = {
  tasks: TaskRow[];
  onEdit?: (task: TaskInput & { id: string }) => void;
};

const COLUMNS = [
  { id: "TODO" as const, title: "To Do" },
  { id: "IN_PROGRESS" as const, title: "In Progress" },
  { id: "COMPLETED" as const, title: "Completed" },
];

export function TaskBoard({ tasks, onEdit }: TaskBoardProps) {
  const router = useRouter();

  async function moveTask(taskId: string, newStatus: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const payload = toTaskInput(task);
    await updateTask(taskId, {
      ...payload,
      status: newStatus as TaskInput["status"],
    });
    router.refresh();
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <Card key={column.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                {column.title}
                <Badge variant="secondary">{columnTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {columnTasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tasks
                </p>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border bg-card p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => onEdit(toTaskInput(task))}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit task</span>
                        </Button>
                      )}
                    </div>
                    {task.case && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.case.caseNumber}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    {column.id !== "COMPLETED" && (
                      <div className="mt-2 flex gap-1">
                        {COLUMNS.filter((c) => c.id !== column.id).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => moveTask(task.id, c.id)}
                            className="rounded px-2 py-0.5 text-xs text-primary hover:bg-muted"
                          >
                            → {c.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
