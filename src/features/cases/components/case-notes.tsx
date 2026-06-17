"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, StickyNote } from "lucide-react";
import { addCaseNote } from "@/actions/cases";
import { caseNoteSchema } from "@/validators";
import { formatDateTime } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/pagination";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";

type CaseNote = {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
};

type CaseNotesProps = {
  caseId: string;
  notes: CaseNote[];
  pagination: PaginationMeta;
};

type NoteInput = { caseId: string; content: string };

export function CaseNotes({ caseId, notes, pagination }: CaseNotesProps) {
  const [error, setError] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<NoteInput>({
    resolver: zodResolver(caseNoteSchema),
    defaultValues: { caseId },
  });

  async function onSubmit(data: NoteInput) {
    setError(null);
    const result = await addCaseNote(data);

    if (result.success && result.data) {
      setLocalNotes([result.data, ...localNotes]);
      reset({ caseId, content: "" });
    } else {
      setError(result.error ?? "Failed to add note");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" {...register("caseId")} />
            <Textarea
              placeholder="Write a case note..."
              rows={3}
              {...register("content")}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Add Note
            </Button>
          </form>
        </CardContent>
      </Card>

      {localNotes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Add the first note for this case."
        />
      ) : (
        <div className="space-y-3">
          {localNotes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDateTime(note.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
          <Suspense fallback={<LoadingSpinner size="sm" />}>
            <PaginationControls {...pagination} pageParam="notePage" />
          </Suspense>
        </div>
      )}
    </div>
  );
}
