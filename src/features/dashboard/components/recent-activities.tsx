import {
  Activity,
  FileText,
  LogIn,
  Receipt,
  Scale,
  UserPlus,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  action: string;
  entity: string;
  details: string | null;
  createdAt: Date;
  user: { firstName: string; lastName: string } | null;
};

type RecentActivitiesProps = {
  activities: ActivityItem[];
};

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  USER_LOGIN: LogIn,
  USER_LOGOUT: LogIn,
  CASE_CREATED: Scale,
  CASE_UPDATED: Scale,
  DOCUMENT_UPLOADED: FileText,
  INVOICE_SENT: Receipt,
  INVOICE_PAID: Receipt,
  CLIENT_CREATED: UserPlus,
};

function getActionIcon(action: string) {
  return ACTION_ICONS[action] ?? Activity;
}

function getActionColor(action: string): string {
  if (action.includes("LOGIN") || action.includes("LOGOUT"))
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (action.includes("CASE"))
    return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
  if (action.includes("DOCUMENT"))
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (action.includes("INVOICE"))
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (action.includes("CLIENT"))
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
  return "bg-primary/10 text-primary";
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {activities.length} events
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activity"
            description="System activity will appear here as users work."
          />
        ) : (
          <div className="relative space-y-0">
            <div className="absolute bottom-4 left-[19px] top-4 w-px bg-border" />
            {activities.map((activity, index) => {
              const Icon = getActionIcon(activity.action);
              const colorClass = getActionColor(activity.action);

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "relative flex gap-4 py-4",
                    index !== activities.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-semibold">
                      {formatAction(activity.action)}
                    </p>
                    {activity.details && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.details}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {activity.user && (
                        <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                      )}
                      <span>{formatDateTime(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
