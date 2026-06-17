"use client";

import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import type { TeamListItem } from "@/actions/teams";
import type { LegalServiceItem, LegalServiceOption } from "@/actions/legal-services";
import type { PaginationMeta } from "@/lib/pagination";
import { usePermissions } from "@/components/providers/permissions-provider";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { AddMemberDialog } from "@/features/teams/components/add-member-dialog";
import { AssignLegalServicesDialog } from "@/features/teams/components/assign-legal-services-dialog";
import { LegalServicesPanel } from "@/features/teams/components/legal-services-panel";
import { TeamCard } from "@/features/teams/components/team-card";
import { TeamFilters } from "@/features/teams/components/team-filters";
import { TeamForm } from "@/features/teams/components/team-form";

type TeamsPageContentProps = {
  teams: TeamListItem[];
  pagination: PaginationMeta;
  legalServices: LegalServiceItem[];
  legalServiceOptions: LegalServiceOption[];
};

export function TeamsPageContent({
  teams,
  pagination,
  legalServices,
  legalServiceOptions,
}: TeamsPageContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamListItem | null>(null);
  const [addMemberTeam, setAddMemberTeam] = useState<TeamListItem | null>(
    null
  );
  const [assignServicesMember, setAssignServicesMember] =
    useState<TeamListItem["members"][number] | null>(null);

  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.teams.create);
  const canManage = can(PERMISSIONS.teams.update);
  const formOpen = createOpen || !!editingTeam;

  function handleFormOpenChange(open: boolean) {
    if (!open) {
      setCreateOpen(false);
      setEditingTeam(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Team"
        description="Create teams, assign staff, and map members to legal services."
        actions={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingTeam(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          ) : undefined
        }
      />

      <LegalServicesPanel
        legalServices={legalServices}
        canManage={canCreate}
      />

      <div className="mb-6">
        <Suspense fallback={<LoadingSpinner />}>
          <TeamFilters />
        </Suspense>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No teams found.</p>
          {canCreate && (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              canManage={canManage}
              onEdit={(t) => {
                setCreateOpen(false);
                setEditingTeam(t);
              }}
              onAddMember={setAddMemberTeam}
              onAssignLegalServices={setAssignServicesMember}
            />
          ))}
        </div>
      )}

      {pagination.total > 0 && (
        <div className="mt-6">
          <PaginationControls {...pagination} />
        </div>
      )}

      <TeamForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        team={editingTeam ?? undefined}
      />

      <AddMemberDialog
        open={!!addMemberTeam}
        onOpenChange={(open) => {
          if (!open) setAddMemberTeam(null);
        }}
        team={addMemberTeam}
      />

      <AssignLegalServicesDialog
        open={!!assignServicesMember}
        onOpenChange={(open) => {
          if (!open) setAssignServicesMember(null);
        }}
        member={assignServicesMember}
        legalServices={legalServiceOptions}
      />
    </>
  );
}
