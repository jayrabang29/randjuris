"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createTeam, updateTeam } from "@/actions/teams";
import type { TeamListItem } from "@/actions/teams";
import { teamSchema, type TeamInput } from "@/validators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TeamFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: TeamListItem;
};

export function TeamForm({ open, onOpenChange, team }: TeamFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!team;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
  });

  useEffect(() => {
    if (!open) return;

    reset(
      team
        ? { name: team.name, description: team.description }
        : { name: "", description: "" }
    );
    setError(null);
  }, [open, team, reset]);

  async function onSubmit(data: TeamInput) {
    setError(null);

    const result = isEditing
      ? await updateTeam(team!.id, data)
      : await createTeam(data);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to save team");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "New Team"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update team name and description"
              : "Create a team to group staff members"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Optional description"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Save Changes" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
