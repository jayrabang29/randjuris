"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CaseInput } from "@/validators";
import type { PaginationMeta } from "@/lib/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CaseForm } from "@/features/cases/components/case-form";
import { CaseTable } from "@/features/cases/components/case-table";

type ClientOption = { id: string; label: string };

type CasesPageContentProps = {
  cases: Parameters<typeof CaseTable>[0]["cases"];
  clients: ClientOption[];
  pagination: PaginationMeta;
  userTeamId: string | null;
  userTeamName?: string | null;
  casesDescription: string;
};

export function CasesPageContent({
  cases,
  clients,
  pagination,
  userTeamId,
  userTeamName,
  casesDescription,
}: CasesPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<
    (CaseInput & { id: string }) | null
  >(null);

  const formOpen = createOpen || !!editingCase;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingCase(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Cases"
        description={casesDescription}
        actions={
          <Button
            onClick={() => {
              setEditingCase(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        }
      />

      <CaseTable
        cases={cases}
        pagination={pagination}
        onEdit={(caseData) => {
          setCreateOpen(false);
          setEditingCase(caseData);
        }}
      />

      <CaseForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        clients={clients}
        userTeamId={userTeamId}
        userTeamName={userTeamName}
        initialData={editingCase ?? undefined}
      />
    </>
  );
}
