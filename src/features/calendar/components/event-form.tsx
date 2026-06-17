"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/actions/calendar";
import { eventSchema, type EventInput } from "@/validators";
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

type EventFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: CaseOption[];
  userTeamId: string | null;
  userTeamName?: string | null;
  initialData?: EventInput & { id?: string };
  defaultDate?: string;
};

const EVENT_TYPES = [
  "HEARING",
  "MEETING",
  "COURT_APPEARANCE",
  "DEADLINE",
  "REMINDER",
] as const;

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

export function EventForm({
  open,
  onOpenChange,
  cases,
  userTeamId,
  userTeamName,
  initialData,
  defaultDate,
}: EventFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const defaultStart = defaultDate
    ? `${defaultDate}T09:00`
    : new Date().toISOString().slice(0, 16);
  const defaultEnd = defaultDate
    ? `${defaultDate}T10:00`
    : new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData ?? {
      type: "MEETING",
      visibility: "GENERAL",
      startTime: defaultStart,
      endTime: defaultEnd,
    },
  });

  const eventType = watch("type");
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
      reset(initialData);
      return;
    }

    reset({
      type: "MEETING",
      visibility: "GENERAL",
      startTime: defaultStart,
      endTime: defaultEnd,
    });
  }, [open, initialData, reset, defaultStart, defaultEnd]);

  async function onSubmit(data: EventInput) {
    setError(null);
    const result = isEditing
      ? await updateEvent(initialData!.id!, data)
      : await createEvent(data);

    if (result.success) {
      reset();
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Operation failed");
    }
  }

  async function handleDelete() {
    if (!initialData?.id || !confirm("Delete this event?")) return;
    const result = await deleteEvent(initialData.id);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "New Event"}</DialogTitle>
          <DialogDescription>
            Schedule hearings, meetings, and deadlines
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
            <Label>Event Type</Label>
            <SearchableSelect
              value={eventType}
              onValueChange={(v) =>
                setValue("type", v as EventInput["type"])
              }
              options={EVENT_TYPES.map((t) => ({
                value: t,
                label: t.replace(/_/g, " "),
              }))}
              searchPlaceholder="Search event types..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register("endTime")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} />
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
                setValue("visibility", v as EventInput["visibility"])
              }
              options={visibilityOptions}
              searchPlaceholder="Search access options..."
            />
            {!userTeamId && (
              <p className="text-xs text-muted-foreground">
                Join a team to create team-only events.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEditing && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
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
                {isEditing ? "Save" : "Create Event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
