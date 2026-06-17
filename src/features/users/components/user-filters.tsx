"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/users?${params.toString()}`);
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
        <Label htmlFor="user-search" className="sr-only">
          Search
        </Label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="user-search"
          placeholder="Search by name or email..."
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
        <Label htmlFor="role-filter" className="mb-2 block text-sm">
          Role
        </Label>
        <SearchableSelect
          id="role-filter"
          value={searchParams.get("role") ?? "all"}
          onValueChange={(v) => updateParams("role", v)}
          options={[
            { value: "all", label: "All roles" },
            ...ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            })),
          ]}
          placeholder="All roles"
          searchPlaceholder="Search roles..."
        />
      </div>
      <div className="w-full sm:w-40">
        <Label htmlFor="status-filter" className="mb-2 block text-sm">
          Status
        </Label>
        <SearchableSelect
          id="status-filter"
          value={searchParams.get("status") ?? "all"}
          onValueChange={(v) => updateParams("status", v)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          placeholder="All statuses"
          searchPlaceholder="Search status..."
        />
      </div>
    </div>
  );
}
