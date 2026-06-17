import { Suspense } from "react";
import { getActivityLogs } from "@/actions/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatDateTime } from "@/lib/utils";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollText } from "lucide-react";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
}>;

function formatAction(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const result = await getActivityLogs({ page, pageSize });
  const activities = result.success ? result.data!.data : [];
  const pagination = toPaginationMeta(result.success ? result.data : undefined);

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        description="Audit trail of system activity"
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No activity logs"
          description="System activity will be recorded here."
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {formatAction(activity.action)}
                      </TableCell>
                      <TableCell>{activity.entity}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.details ?? "—"}
                      </TableCell>
                      <TableCell>
                        {activity.user
                          ? `${activity.user.firstName} ${activity.user.lastName}`
                          : "System"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(activity.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Suspense fallback={<LoadingSpinner size="sm" />}>
            <PaginationControls {...pagination} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
