"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createTimeEntry } from "@/actions/billing";
import { timeEntrySchema, type TimeEntryInput } from "@/validators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";

type CaseOption = { id: string; label: string };

type TimeEntryFormProps = {
  cases: CaseOption[];
};

export function TimeEntryForm({ cases }: TimeEntryFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeEntryInput>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      rate: 250,
    },
  });

  const caseId = watch("caseId");

  async function onSubmit(data: TimeEntryInput) {
    setError(null);
    const result = await createTimeEntry(data);

    if (result.success) {
      reset();
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create time entry");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Log Time</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Time Entry</DialogTitle>
          <DialogDescription>
            Record billable hours against a case
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Case</Label>
            <SearchableSelect
              value={caseId ?? ""}
              onValueChange={(v) => setValue("caseId", v)}
              options={cases.map((c) => ({ value: c.id, label: c.label }))}
              placeholder="Select case"
              searchPlaceholder="Search cases..."
            />
            {errors.caseId && (
              <p className="text-sm text-destructive">{errors.caseId.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                {...register("hours")}
              />
              {errors.hours && (
                <p className="text-sm text-destructive">{errors.hours.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (₱/hr)</Label>
              <Input
                id="rate"
                type="number"
                step="1"
                min="1"
                {...register("rate")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
