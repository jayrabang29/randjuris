"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS, type PaginationMeta } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";

type PaginationControlsProps = PaginationMeta & {
  pageParam?: string;
  pageSizeParam?: string;
  showPageSize?: boolean;
  className?: string;
};

export function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  pageParam = "page",
  pageSizeParam = "pageSize",
  showPageSize = true,
  className,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (updates[pageParam] === "1") {
      params.delete(pageParam);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${start}–${end} of ${total} result${total !== 1 ? "s" : ""}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {showPageSize && (
          <SearchableSelect
            value={String(pageSize)}
            onValueChange={(value) =>
              navigate({ [pageSizeParam]: value, [pageParam]: "1" })
            }
            options={PAGE_SIZE_OPTIONS.map((size) => ({
              value: String(size),
              label: `${size} / page`,
            }))}
            searchPlaceholder="Search page size..."
            className="w-[120px]"
          />
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ [pageParam]: String(page - 1) })}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ [pageParam]: String(page + 1) })}
          disabled={page >= totalPages || totalPages === 0}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
