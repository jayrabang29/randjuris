import { getTeams } from "@/actions/teams";
import { getLegalServices } from "@/actions/legal-services";
import { TeamsPageContent } from "@/features/teams/components/teams-page-content";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";

type SearchParams = Promise<{
  search?: string;
  page?: string;
  pageSize?: string;
}>;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(PERMISSIONS.teams.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const result = await getTeams({
    search: params.search,
    page,
    pageSize,
  });

  const legalServicesResult = await getLegalServices();
  const legalServices = legalServicesResult.success
    ? legalServicesResult.data ?? []
    : [];
  const legalServiceOptions = legalServices.map((service) => ({
    id: service.id,
    name: service.name,
  }));

  const teams = result.success ? result.data!.data : [];
  const pagination = toPaginationMeta(result.success ? result.data : undefined);

  return (
    <TeamsPageContent
      teams={teams}
      pagination={pagination}
      legalServices={legalServices}
      legalServiceOptions={legalServiceOptions}
    />
  );
}
