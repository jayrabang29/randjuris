"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createCategory, updateCategory } from "@/actions/categories";
import type { CategoryItem } from "@/actions/categories";
import { categorySchema, type CategoryInput } from "@/validators";
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

type CategoryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryItem;
};

export function CategoryForm({
  open,
  onOpenChange,
  category,
}: CategoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (!open) return;

    reset(
      category
        ? {
            name: category.name,
            code: category.code,
            description: category.description,
          }
        : { name: "", code: "", description: "" }
    );
    setError(null);
  }, [open, category, reset]);

  async function onSubmit(data: CategoryInput) {
    setError(null);

    const result = isEditing
      ? await updateCategory(category!.id, data)
      : await createCategory(data);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to save category");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update document category details"
              : "Add a category for classifying documents"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input id="category-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-code">Code</Label>
            <Input
              id="category-code"
              placeholder="e.g. COURT_ORDER"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              rows={3}
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
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
