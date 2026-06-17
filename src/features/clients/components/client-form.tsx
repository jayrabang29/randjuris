"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createClient, updateClient } from "@/actions/clients";
import { clientSchema, type ClientInput } from "@/validators";
import type { ClientWithCases } from "@/types";
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

type ClientFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientWithCases;
  onSuccess?: () => void;
};

export function ClientForm({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!client;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          firstName: client.firstName,
          lastName: client.lastName,
          companyName: client.companyName,
          email: client.email,
          phone: client.phone,
          address: client.address,
          clientType: client.clientType,
          notes: client.notes,
        }
      : { clientType: "INDIVIDUAL" },
  });

  const clientType = watch("clientType");

  useEffect(() => {
    if (!open) return;

    reset(
      client
        ? {
            firstName: client.firstName,
            lastName: client.lastName,
            companyName: client.companyName,
            email: client.email,
            phone: client.phone,
            address: client.address,
            clientType: client.clientType,
            notes: client.notes,
          }
        : { clientType: "INDIVIDUAL" }
    );
    setError(null);
  }, [open, client, reset]);

  async function onSubmit(data: ClientInput) {
    setError(null);
    const result = isEditing
      ? await updateClient(client!.id, data)
      : await createClient(data);

    if (result.success) {
      reset();
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } else {
      setError(result.error ?? "Operation failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update client information"
              : "Add a new client to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client Type</Label>
            <SearchableSelect
              value={clientType}
              onValueChange={(v) =>
                setValue("clientType", v as ClientInput["clientType"])
              }
              options={[
                { value: "INDIVIDUAL", label: "Individual" },
                { value: "CORPORATE", label: "Corporate" },
              ]}
              searchPlaceholder="Search type..."
            />
          </div>

          {clientType === "CORPORATE" && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName")} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
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
              {isEditing ? "Save Changes" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
