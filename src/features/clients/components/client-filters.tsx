"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/clients?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="search"
          placeholder="Search by name, email, or company..."
          className="pl-9"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(
              () => updateParams("search", e.target.value),
              300
            );
          }}
        />
      </div>
      <div className="w-full sm:w-48">
        <Label htmlFor="clientType" className="mb-2 block text-sm">
          Type
        </Label>
        <SearchableSelect
          id="clientType"
          value={searchParams.get("clientType") ?? "all"}
          onValueChange={(v) =>
            updateParams("clientType", v === "all" ? "" : v)
          }
          options={[
            { value: "all", label: "All types" },
            { value: "INDIVIDUAL", label: "Individual" },
            { value: "CORPORATE", label: "Corporate" },
          ]}
          placeholder="All types"
          searchPlaceholder="Search type..."
        />
      </div>
    </div>
  );
}
