"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { createInvoice } from "@/actions/billing";
import { invoiceSchema, type InvoiceInput } from "@/validators";
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

type ClientOption = { id: string; label: string };

type InvoiceFormProps = {
  clients: ClientOption[];
};

export function InvoiceForm({ clients }: InvoiceFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const clientId = watch("clientId");
  const items = watch("items");
  const total = items?.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  ) ?? 0;

  async function onSubmit(data: InvoiceInput) {
    setError(null);
    const result = await createInvoice(data);

    if (result.success) {
      reset();
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create invoice");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Generate a new invoice for a client
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ description: "", quantity: 1, unitPrice: 0 })
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder="Description"
                  className="flex-1"
                  {...register(`items.${index}.description`)}
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-16"
                  {...register(`items.${index}.quantity`)}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  className="w-24"
                  {...register(`items.${index}.unitPrice`)}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.items && (
              <p className="text-sm text-destructive">
                {errors.items.message ?? errors.items.root?.message}
              </p>
            )}
          </div>

          <div className="text-right text-sm font-medium">
            Total: {formatCurrency(total)}
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
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
