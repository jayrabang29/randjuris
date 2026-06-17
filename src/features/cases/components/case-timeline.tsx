import { Calendar, FileText, Gavel, StickyNote } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

type TimelineEvent = {
  id: string;
  type: "activity" | "note" | "event";
  title: string;
  description?: string | null;
  timestamp: Date;
  icon?: "gavel" | "note" | "calendar" | "file";
};

type CaseTimelineProps = {
  events: TimelineEvent[];
};

const iconMap = {
  gavel: Gavel,
  note: StickyNote,
  calendar: Calendar,
  file: FileText,
};

export function CaseTimeline({ events }: CaseTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No timeline events"
        description="Case activity, notes, and calendar events will appear here."
      />
    );
  }

  const sorted = [...events].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      {sorted.map((event) => {
        const Icon = iconMap[event.icon ?? "file"];
        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <Card className="flex-1">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{event.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
