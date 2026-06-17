"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import type { ClientWithCases } from "@/types";
import type { PaginationMeta } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ClientFilters } from "@/features/clients/components/client-filters";
import { ClientForm } from "@/features/clients/components/client-form";
import { ClientTable } from "@/features/clients/components/client-table";

type ClientsPageContentProps = {
  clients: ClientWithCases[];
  pagination: PaginationMeta;
};

function ClientsPageContent({ clients, pagination }: ClientsPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithCases | null>(
    null
  );

  const formOpen = createOpen || !!editingClient;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingClient(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description="Manage your law firm's client directory"
        actions={
          <Button
            onClick={() => {
              setEditingClient(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        }
      />

      <div className="mb-6">
        <Suspense fallback={<LoadingSpinner />}>
          <ClientFilters />
        </Suspense>
      </div>

      <ClientTable
        clients={clients}
        pagination={pagination}
        onEdit={(client) => {
          setCreateOpen(false);
          setEditingClient(client);
        }}
      />

      <ClientForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        client={editingClient ?? undefined}
      />
    </>
  );
}

export { ClientsPageContent };
