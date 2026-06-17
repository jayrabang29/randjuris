"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateUserLegalServices } from "@/actions/legal-services";
import type { TeamMember } from "@/actions/teams";
import type { LegalServiceOption } from "@/actions/legal-services";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";

type AssignLegalServicesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  legalServices: LegalServiceOption[];
};

export function AssignLegalServicesDialog({
  open,
  onOpenChange,
  member,
  legalServices,
}: AssignLegalServicesDialogProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !member) return;
    setSelectedIds(member.legalServices.map((service) => service.id));
    setError(null);
  }, [open, member]);

  async function handleSave() {
    if (!member) return;

    setSubmitting(true);
    setError(null);

    const result = await updateUserLegalServices(member.id, selectedIds);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update legal services");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legal Services</DialogTitle>
          <DialogDescription>
            Assign practice areas for {member?.firstName} {member?.lastName}.
            A user can be assigned to multiple legal services.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <SearchableMultiSelect
          values={selectedIds}
          onValuesChange={setSelectedIds}
          options={legalServices.map((service) => ({
            value: service.id,
            label: service.name,
          }))}
          placeholder="Select legal services"
          searchPlaceholder="Search legal services..."
          emptyText="No legal services found."
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Services
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
