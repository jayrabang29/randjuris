"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@prisma/client";
import { Info } from "lucide-react";
import { updatePageAccess } from "@/actions/permissions";
import type { PageAccessMatrix, PermissionMatrix } from "@/lib/permission-store";
import { ROLE_LABELS } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionsMatrix } from "@/features/permissions/components/permissions-matrix";

type PermissionsPageContentProps = {
  initialPages: PageAccessMatrix;
  initialScopes: PermissionMatrix;
};

export function PermissionsPageContent({
  initialPages,
  initialScopes,
}: PermissionsPageContentProps) {
  const [pages, setPages] = useState(initialPages);
  const [scopes, setScopes] = useState(initialScopes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePageToggle(
    role: UserRole,
    permissionId: string,
    enabled: boolean
  ) {
    setError(null);

    setPages((current) => ({
      ...current,
      access: {
        ...current.access,
        [permissionId]: {
          ...current.access[permissionId],
          [role]: enabled,
        },
      },
    }));

    startTransition(async () => {
      const result = await updatePageAccess(role, permissionId, enabled);
      if (!result.success) {
        setPages(initialPages);
        setError(result.error ?? "Failed to update permission");
      }
    });
  }

  function handleScopeToggle(
    role: UserRole,
    permissionId: string,
    enabled: boolean
  ) {
    setError(null);

    setScopes((current) => ({
      ...current,
      access: {
        ...current.access,
        [permissionId]: {
          ...current.access[permissionId],
          [role]: enabled,
        },
      },
    }));

    startTransition(async () => {
      const result = await updatePageAccess(role, permissionId, enabled);
      if (!result.success) {
        setScopes(initialScopes);
        setError(result.error ?? "Failed to update permission");
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Permissions"
        description="Control which pages each role can access. Super Admin always has full access."
      />

      <div className="mb-6 flex gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Changes apply immediately for navigation and server checks. Active
          sessions may need a refresh or re-login to update route access in
          middleware.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <PermissionsMatrix
        title="Page Access"
        description="Control which pages each role can open in the sidebar."
        matrix={pages}
        disabled={isPending}
        onToggle={handlePageToggle}
        roleLabels={ROLE_LABELS}
      />

      <div className="mt-10">
        <PermissionsMatrix
          title="Data Scope"
          description="Grant firm-wide visibility for cases and billing. Without these, users only see general records, their team's data, and records they created or are assigned to."
          matrix={scopes}
          disabled={isPending}
          onToggle={handleScopeToggle}
          roleLabels={ROLE_LABELS}
          showDescriptions
        />
      </div>
    </>
  );
}
