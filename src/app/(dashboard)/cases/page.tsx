import { getCases } from "@/actions/cases";
import { getClients } from "@/actions/clients";
import { CasesPageContent } from "@/features/cases/components/cases-page-content";
import { canViewAllCases } from "@/lib/case-access";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import prisma from "@/lib/prisma";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
}>;

export default async function CasesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission(PERMISSIONS.cases.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      teamId: true,
      team: { select: { name: true } },
    },
  });

  const casesScope = canViewAllCases({
    id: user.id,
    role: user.role,
    teamId: dbUser?.teamId ?? null,
    permissions: user.permissions,
  });

  const casesDescription = casesScope
    ? "Manage all firm cases and assignments"
    : dbUser?.team?.name
      ? `Showing general cases, your team's cases, and cases you created or are assigned to (${dbUser.team.name})`
      : "Showing general cases and cases you created or are assigned to";

  const [casesResult, clientsResult] = await Promise.all([
    getCases({ page, pageSize }),
    getClients({ pageSize: 100 }),
  ]);

  const cases = casesResult.success ? casesResult.data!.data : [];
  const pagination = toPaginationMeta(
    casesResult.success ? casesResult.data : undefined
  );
  const clients = clientsResult.success
    ? clientsResult.data!.data.map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}${c.companyName ? ` (${c.companyName})` : ""}`,
      }))
    : [];

  return (
    <CasesPageContent
      cases={cases}
      clients={clients}
      pagination={pagination}
      userTeamId={dbUser?.teamId ?? null}
      userTeamName={dbUser?.team?.name ?? null}
      casesDescription={casesDescription}
    />
  );
}
