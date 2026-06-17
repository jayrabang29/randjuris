"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Scale, Trash2, UserMinus, UserPlus } from "lucide-react";
import { UserRole } from "@prisma/client";
import { deleteTeam, removeTeamMember } from "@/actions/teams";
import type { TeamListItem } from "@/actions/teams";
import { ROLE_LABELS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeamCardProps = {
  team: TeamListItem;
  canManage: boolean;
  onEdit: (team: TeamListItem) => void;
  onAddMember: (team: TeamListItem) => void;
  onAssignLegalServices: (member: TeamListItem["members"][number]) => void;
};

export function TeamCard({
  team,
  canManage,
  onEdit,
  onAddMember,
  onAssignLegalServices,
}: TeamCardProps) {
  const router = useRouter();

  async function handleRemoveMember(userId: string, name: string) {
    if (!confirm(`Remove ${name} from ${team.name}?`)) return;

    const result = await removeTeamMember(userId);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to remove member");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete team "${team.name}"? Members will be unassigned but not deleted.`
      )
    ) {
      return;
    }

    const result = await deleteTeam(team.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to delete team");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          {team.description && (
            <CardDescription>{team.description}</CardDescription>
          )}
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(team)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddMember(team)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Members ({team._count.members})
          </p>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddMember(team)}
            >
              <UserPlus className="mr-2 h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>

        {team.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="space-y-2">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="rounded-md border px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                    {member.legalServices.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {member.legalServices.map((service) => (
                          <Badge
                            key={service.id}
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[member.role as UserRole]}
                    </Badge>
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => onAssignLegalServices(member)}
                          title="Assign legal services"
                        >
                          <Scale className="h-3.5 w-3.5" />
                          <span className="sr-only">Assign legal services</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              `${member.firstName} ${member.lastName}`
                            )
                          }
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove member</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
