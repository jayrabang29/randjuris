"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UserRole } from "@prisma/client";
import { addTeamMember, getUnassignedUsers } from "@/actions/teams";
import type { AvailableUser, TeamListItem } from "@/actions/teams";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamListItem | null;
};

export function AddMemberDialog({
  open,
  onOpenChange,
  team,
}: AddMemberDialogProps) {
  const router = useRouter();
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !team) return;

    setSelectedUserId("");
    setError(null);
    setLoading(true);

    getUnassignedUsers().then((result) => {
      if (result.success) {
        setUsers(result.data ?? []);
      } else {
        setError(result.error ?? "Failed to load users");
        setUsers([]);
      }
      setLoading(false);
    });
  }, [open, team]);

  async function handleAdd() {
    if (!team || !selectedUserId) return;

    setSubmitting(true);
    setError(null);

    const result = await addTeamMember(team.id, selectedUserId);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to add member");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Add a user to {team?.name}. Users already assigned to another team
            cannot be added.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>User</Label>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading available users...
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unassigned users available.
            </p>
          ) : (
            <SearchableSelect
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              options={users.map((user) => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName} — ${ROLE_LABELS[user.role as UserRole]}`,
              }))}
              placeholder="Select a user"
              searchPlaceholder="Search users..."
              emptyText="No unassigned users found."
            />
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedUserId || submitting || loading}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
