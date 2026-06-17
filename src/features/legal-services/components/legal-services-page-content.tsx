"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import type { LegalServiceItem } from "@/actions/legal-services";
import type { PaginationMeta } from "@/lib/pagination";
import { usePermissions } from "@/components/providers/permissions-provider";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { LegalServiceFilters } from "@/features/legal-services/components/legal-service-filters";
import { LegalServiceForm } from "@/features/legal-services/components/legal-service-form";
import { LegalServiceTable } from "@/features/legal-services/components/legal-service-table";

type LegalServicesPageContentProps = {
  services: LegalServiceItem[];
  pagination: PaginationMeta;
};

export function LegalServicesPageContent({
  services,
  pagination,
}: LegalServicesPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<LegalServiceItem | null>(
    null
  );

  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.legal_services.create);
  const canManage = can(PERMISSIONS.legal_services.update);
  const canDelete = can(PERMISSIONS.legal_services.delete);
  const formOpen = createOpen || !!editingService;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingService(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Legal Services"
        description="Manage practice areas that can be assigned to team members"
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingService(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6">
        <Suspense fallback={<LoadingSpinner />}>
          <LegalServiceFilters />
        </Suspense>
      </div>

      <LegalServiceTable
        services={services}
        pagination={pagination}
        canManage={canManage}
        canDelete={canDelete}
        onEdit={(service) => {
          setCreateOpen(false);
          setEditingService(service);
        }}
      />

      <LegalServiceForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        service={editingService ?? undefined}
      />
    </>
  );
}
