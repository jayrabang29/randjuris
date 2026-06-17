"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import type { CategoryItem } from "@/actions/categories";
import type { PaginationMeta } from "@/lib/pagination";
import { usePermissions } from "@/components/providers/permissions-provider";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { CategoryFilters } from "@/features/categories/components/category-filters";
import { CategoryForm } from "@/features/categories/components/category-form";
import { CategoryTable } from "@/features/categories/components/category-table";

type CategoriesPageContentProps = {
  categories: CategoryItem[];
  pagination: PaginationMeta;
};

export function CategoriesPageContent({
  categories,
  pagination,
}: CategoriesPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(
    null
  );

  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.categories.create);
  const canManage = can(PERMISSIONS.categories.update);
  const canDelete = can(PERMISSIONS.categories.delete);
  const formOpen = createOpen || !!editingCategory;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingCategory(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Manage document categories used when uploading files"
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6">
        <Suspense fallback={<LoadingSpinner />}>
          <CategoryFilters />
        </Suspense>
      </div>

      <CategoryTable
        categories={categories}
        pagination={pagination}
        canManage={canManage}
        canDelete={canDelete}
        onEdit={(category) => {
          setCreateOpen(false);
          setEditingCategory(category);
        }}
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        category={editingCategory ?? undefined}
      />
    </>
  );
}
