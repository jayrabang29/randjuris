"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  createLegalService,
  updateLegalService,
} from "@/actions/legal-services";
import type { LegalServiceItem } from "@/actions/legal-services";
import { legalServiceSchema, type LegalServiceInput } from "@/validators";
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

type LegalServiceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: LegalServiceItem;
};

export function LegalServiceForm({
  open,
  onOpenChange,
  service,
}: LegalServiceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LegalServiceInput>({
    resolver: zodResolver(legalServiceSchema),
  });

  useEffect(() => {
    if (!open) return;

    reset(
      service
        ? { name: service.name, description: service.description }
        : { name: "", description: "" }
    );
    setError(null);
  }, [open, service, reset]);

  async function onSubmit(data: LegalServiceInput) {
    setError(null);

    const result = isEditing
      ? await updateLegalService(service!.id, data)
      : await createLegalService(data);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to save legal service");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Legal Service" : "New Legal Service"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update practice area details"
              : "Add a practice area that can be assigned to users"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="legal-service-name">Name</Label>
            <Input id="legal-service-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal-service-description">Description</Label>
            <Textarea
              id="legal-service-description"
              rows={3}
              placeholder="Optional description"
              {...register("description")}
            />
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
              {isEditing ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
