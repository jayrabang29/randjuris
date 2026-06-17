"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

type CaseOption = { id: string; label: string };

type DocumentUploadProps = {
  cases: CaseOption[];
  categories: { id: string; name: string }[];
  userTeamId: string | null;
  userTeamName?: string | null;
};

const VISIBILITY_OPTIONS = [
  {
    value: "GENERAL",
    label: "General — visible to all users",
  },
  {
    value: "TEAM",
    label: "Team only — visible to your team",
  },
] as const;

export function DocumentUpload({
  cases,
  categories,
  userTeamId,
  userTeamName,
}: DocumentUploadProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [visibility, setVisibility] = useState<string>("GENERAL");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const visibilityOptions = (userTeamId
    ? VISIBILITY_OPTIONS
    : VISIBILITY_OPTIONS.filter((option) => option.value === "GENERAL")
  ).map((option) => ({
    value: option.value,
    label:
      option.value === "TEAM" && userTeamName
        ? `Team only — ${userTeamName}`
        : option.label,
  }));

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!caseId) {
      setError("Please select a case");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    if (visibility === "TEAM" && !userTeamId) {
      setError("You must belong to a team to upload team-only documents");
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", caseId);
    formData.append("categoryId", categoryId);
    formData.append("visibility", visibility);

    const result = await uploadDocument(formData);

    setUploading(false);

    if (result.success) {
      setOpen(false);
      setCaseId("");
      setCategoryId("");
      setVisibility("GENERAL");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } else {
      setError(result.error ?? "Upload failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Attach a file to a case and choose who can access it
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Case</Label>
            <SearchableSelect
              value={caseId}
              onValueChange={setCaseId}
              options={cases.map((c) => ({ value: c.id, label: c.label }))}
              placeholder="Select case"
              searchPlaceholder="Search cases..."
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <SearchableSelect
              value={categoryId}
              onValueChange={setCategoryId}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
            />
          </div>
          <div className="space-y-2">
            <Label>Access</Label>
            <SearchableSelect
              value={visibility}
              onValueChange={setVisibility}
              options={visibilityOptions}
              placeholder="Select access level"
              searchPlaceholder="Search access..."
            />
            <p className="text-xs text-muted-foreground">
              General documents are visible to everyone. Team-only documents are
              visible to members of your team and firm administrators.
            </p>
            {!userTeamId && (
              <p className="text-xs text-amber-600">
                You are not assigned to a team, so only General uploads are
                available.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <input
              ref={fileRef}
              id="file"
              type="file"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
