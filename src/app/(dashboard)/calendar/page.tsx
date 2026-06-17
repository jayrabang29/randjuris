import { getEvents } from "@/actions/calendar";
import { getCases } from "@/actions/cases";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/features/calendar/components/calendar-view";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";

export default async function CalendarPage() {
  const user = await requirePermission(PERMISSIONS.calendar.read);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      teamId: true,
      team: { select: { name: true } },
    },
  });

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const [eventsResult, casesResult] = await Promise.all([
    getEvents({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }),
    getCases({ pageSize: 100 }),
  ]);

  const events = (eventsResult.success ? eventsResult.data! : []).map(
    (event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      visibility: event.visibility,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description,
      caseId: event.caseId,
    })
  );
  const cases = casesResult.success
    ? casesResult.data!.data.map((c) => ({
        id: c.id,
        label: `${c.caseNumber} — ${c.title}`,
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Manage hearings, meetings, and deadlines"
      />
      <CalendarView
        events={events}
        cases={cases}
        userTeamId={dbUser?.teamId ?? null}
        userTeamName={dbUser?.team?.name ?? null}
      />
    </div>
  );
}
