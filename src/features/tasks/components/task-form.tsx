"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createTask, updateTask } from "@/actions/tasks";
import { taskSchema, type TaskInput } from "@/validators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";

type CaseOption = { id: string; label: string };

type TaskFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: CaseOption[];
  userTeamId: string | null;
  userTeamName?: string | null;
  initialData?: TaskInput & { id?: string };
};

const VISIBILITY_OPTIONS = [
  {
    value: "GENERAL",
    label: "General — visible to all users",
  },
  {
    value: "TEAM",
    label: "Team only — visible to your team",
  },
] as const;

export function TaskForm({
  open,
  onOpenChange,
  cases,
  userTeamId,
  userTeamName,
  initialData,
}: TaskFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData ?? {
      status: "TODO",
      priority: "MEDIUM",
      visibility: "GENERAL",
    },
  });

  const status = watch("status");
  const priority = watch("priority");
  const caseId = watch("caseId");
  const visibility = watch("visibility");

  const visibilityOptions = (userTeamId
    ? VISIBILITY_OPTIONS
    : VISIBILITY_OPTIONS.filter((option) => option.value === "GENERAL")
  ).map((option) => ({
    value: option.value,
    label:
      option.value === "TEAM" && userTeamName
        ? `Team only — ${userTeamName}`
        : option.label,
  }));

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        ...initialData,
        dueDate: initialData.dueDate ?? null,
        caseId: initialData.caseId ?? null,
        assigneeId: initialData.assigneeId ?? null,
      });
    } else {
      reset({
        status: "TODO",
        priority: "MEDIUM",
        visibility: "GENERAL",
      });
    }
    setError(null);
  }, [open, initialData, reset]);

  async function onSubmit(data: TaskInput) {
    setError(null);
    const result = isEditing
      ? await updateTask(initialData!.id!, data)
      : await createTask(data);

    if (result.success) {
      reset();
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Operation failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update task details" : "Create a new task"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <SearchableSelect
                value={status ?? "TODO"}
                onValueChange={(v) =>
                  setValue("status", v as TaskInput["status"])
                }
                options={[
                  { value: "TODO", label: "To Do" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                ]}
                searchPlaceholder="Search status..."
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <SearchableSelect
                value={priority ?? "MEDIUM"}
                onValueChange={(v) =>
                  setValue("priority", v as TaskInput["priority"])
                }
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "CRITICAL", label: "Critical" },
                ]}
                searchPlaceholder="Search priority..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>

          <div className="space-y-2">
            <Label>Related Case</Label>
            <SearchableSelect
              value={caseId ?? "none"}
              onValueChange={(v) =>
                setValue("caseId", v === "none" ? null : v)
              }
              options={[
                { value: "none", label: "None" },
                ...cases.map((c) => ({ value: c.id, label: c.label })),
              ]}
              placeholder="Optional"
              searchPlaceholder="Search cases..."
            />
          </div>

          <div className="space-y-2">
            <Label>Access</Label>
            <SearchableSelect
              value={visibility ?? "GENERAL"}
              onValueChange={(v) =>
                setValue("visibility", v as TaskInput["visibility"])
              }
              options={visibilityOptions}
              searchPlaceholder="Search access options..."
            />
            {!userTeamId && (
              <p className="text-xs text-muted-foreground">
                Join a team to create team-only tasks.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Save" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
