import { notFound } from "next/navigation";
import { getCase, getCaseNotes } from "@/actions/cases";
import { getDocuments } from "@/actions/documents";
import { getTasks } from "@/actions/tasks";
import { getEvents } from "@/actions/calendar";
import { CaseDetail } from "@/features/cases/components/case-detail";
import {
  parseNamedPageParam,
  parsePaginationParams,
  toPaginationMeta,
} from "@/lib/pagination";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  pageSize?: string;
  docPage?: string;
  taskPage?: string;
  notePage?: string;
}>;

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { pageSize } = parsePaginationParams(sp);
  const docPage = parseNamedPageParam(sp, "docPage");
  const taskPage = parseNamedPageParam(sp, "taskPage");
  const notePage = parseNamedPageParam(sp, "notePage");

  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [caseResult, docsResult, tasksResult, notesResult, eventsResult] =
    await Promise.all([
      getCase(id),
      getDocuments({ caseId: id, page: docPage, pageSize }),
      getTasks({ caseId: id, page: taskPage, pageSize }),
      getCaseNotes(id, { page: notePage, pageSize }),
      getEvents({
        startDate: sixMonthsAgo.toISOString(),
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        caseId: id,
      }),
    ]);

  if (!caseResult.success || !caseResult.data) {
    notFound();
  }

  const caseData = caseResult.data;
  const documents = docsResult.success ? docsResult.data!.data : [];
  const tasks = tasksResult.success ? tasksResult.data!.data : [];
  const notes = notesResult.success ? notesResult.data!.data : [];
  const events = eventsResult.success ? eventsResult.data! : [];

  const documentsPagination = toPaginationMeta(
    docsResult.success ? docsResult.data : undefined
  );
  const tasksPagination = toPaginationMeta(
    tasksResult.success ? tasksResult.data : undefined
  );
  const notesPagination = toPaginationMeta(
    notesResult.success ? notesResult.data : undefined
  );

  const activities = await prisma.activityLog.findMany({
    where: { entity: "Case", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const timelineEvents = [
    ...activities.map((a) => ({
      id: `activity-${a.id}`,
      type: "activity" as const,
      title: a.action.replace(/_/g, " "),
      description: a.details,
      timestamp: a.createdAt,
      icon: "gavel" as const,
    })),
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      type: "note" as const,
      title: "Case Note Added",
      description: n.content,
      timestamp: n.createdAt,
      icon: "note" as const,
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      type: "event" as const,
      title: e.title,
      description: e.description,
      timestamp: e.startTime,
      icon: "calendar" as const,
    })),
  ];

  return (
    <CaseDetail
      caseData={caseData}
      documents={documents}
      tasks={tasks}
      notes={notes}
      timelineEvents={timelineEvents}
      documentsPagination={documentsPagination}
      tasksPagination={tasksPagination}
      notesPagination={notesPagination}
    />
  );
}
