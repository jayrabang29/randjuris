import { getTasks } from "@/actions/tasks";
import { getCases } from "@/actions/cases";
import { TasksPageContent } from "@/features/tasks/components/tasks-page-content";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import prisma from "@/lib/prisma";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
}>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission(PERMISSIONS.tasks.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      teamId: true,
      team: { select: { name: true } },
    },
  });

  const [tasksResult, casesResult] = await Promise.all([
    getTasks({ page, pageSize }),
    getCases({ pageSize: 100 }),
  ]);

  const tasks = tasksResult.success ? tasksResult.data!.data : [];
  const pagination = toPaginationMeta(
    tasksResult.success ? tasksResult.data : undefined
  );
  const cases = casesResult.success
    ? casesResult.data!.data.map((c) => ({
        id: c.id,
        label: `${c.caseNumber} — ${c.title}`,
      }))
    : [];

  return (
    <TasksPageContent
      tasks={tasks}
      cases={cases}
      pagination={pagination}
      userTeamId={dbUser?.teamId ?? null}
      userTeamName={dbUser?.team?.name ?? null}
    />
  );
}
