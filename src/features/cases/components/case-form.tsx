"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createCase, updateCase } from "@/actions/cases";
import { caseSchema, type CaseInput } from "@/validators";
import { generateCaseNumber } from "@/lib/utils";
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

type ClientOption = { id: string; label: string };

type CaseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  userTeamId: string | null;
  userTeamName?: string | null;
  initialData?: CaseInput & { id?: string };
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

const CATEGORIES = [
  "CIVIL",
  "CRIMINAL",
  "CORPORATE",
  "FAMILY",
  "REAL_ESTATE",
  "INTELLECTUAL_PROPERTY",
  "LABOR",
  "TAX",
  "OTHER",
] as const;

const STATUSES = [
  "NEW",
  "ACTIVE",
  "PENDING",
  "IN_COURT",
  "SETTLED",
  "CLOSED",
] as const;

export function CaseForm({
  open,
  onOpenChange,
  clients,
  userTeamId,
  userTeamName,
  initialData,
}: CaseFormProps) {
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
  } = useForm<CaseInput>({
    resolver: zodResolver(caseSchema),
    defaultValues: initialData ?? {
      caseNumber: generateCaseNumber(),
      status: "NEW",
      category: "OTHER",
      visibility: "GENERAL",
    },
  });

  const category = watch("category");
  const status = watch("status");
  const clientId = watch("clientId");
  const visibility = watch("visibility");

  const visibilityOptions = (userTeamId
    ? VISIBILITY_OPTIONS
    : VISIBILITY_OPTIONS.filter((option) => option.value === "GENERAL")
  ).map((option) => ({
    value: option.value,
    label:
      option.value === "TEAM" && userTeamName
        ? `Team only — visible to ${userTeamName}`
        : option.label,
  }));

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset(initialData);
    } else {
      reset({
        caseNumber: generateCaseNumber(),
        status: "NEW",
        category: "OTHER",
        visibility: "GENERAL",
      });
    }
    setError(null);
  }, [open, initialData, reset]);

  async function onSubmit(data: CaseInput) {
    setError(null);
    const result = isEditing
      ? await updateCase(initialData!.id!, data)
      : await createCase(data);

    if (result.success) {
      reset();
      onOpenChange(false);
      router.refresh();
      if (!isEditing && result.data) {
        router.push(`/cases/${result.data.id}`);
      }
    } else {
      setError(result.error ?? "Operation failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Case" : "New Case"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update case details" : "Create a new legal case"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caseNumber">Case Number</Label>
            <Input id="caseNumber" {...register("caseNumber")} />
            {errors.caseNumber && (
              <p className="text-sm text-destructive">
                {errors.caseNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <SearchableSelect
              value={clientId ?? ""}
              onValueChange={(v) => setValue("clientId", v)}
              options={clients.map((c) => ({ value: c.id, label: c.label }))}
              placeholder="Select client"
              searchPlaceholder="Search clients..."
            />
            {errors.clientId && (
              <p className="text-sm text-destructive">
                {errors.clientId.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableSelect
                value={category}
                onValueChange={(v) =>
                  setValue("category", v as CaseInput["category"])
                }
                options={CATEGORIES.map((cat) => ({
                  value: cat,
                  label: cat.replace(/_/g, " "),
                }))}
                searchPlaceholder="Search categories..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <SearchableSelect
                value={status}
                onValueChange={(v) =>
                  setValue("status", v as CaseInput["status"])
                }
                options={STATUSES.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, " "),
                }))}
                searchPlaceholder="Search status..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courtName">Court Name</Label>
            <Input id="courtName" {...register("courtName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filingDate">Filing Date</Label>
            <Input id="filingDate" type="date" {...register("filingDate")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Access</Label>
            <SearchableSelect
              value={visibility ?? "GENERAL"}
              onValueChange={(v) =>
                setValue("visibility", v as CaseInput["visibility"])
              }
              options={visibilityOptions}
              searchPlaceholder="Search access options..."
            />
            {!userTeamId && (
              <p className="text-xs text-muted-foreground">
                Join a team to create team-only cases.
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
              {isEditing ? "Save Changes" : "Create Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
