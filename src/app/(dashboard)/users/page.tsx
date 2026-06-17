import { getUsers } from "@/actions/users";
import { getTeamOptions } from "@/actions/teams";
import { getLegalServiceOptions } from "@/actions/legal-services";
import { UsersPageContent } from "@/features/users/components/users-page-content";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

type SearchParams = Promise<{
  search?: string;
  role?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}>;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission(PERMISSIONS.users.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const result = await getUsers({
    search: params.search,
    role: params.role as UserRole | undefined,
    status: (params.status as "active" | "inactive" | "all") ?? "all",
    page,
    pageSize,
  });

  const teamsResult = await getTeamOptions();
  const teams = teamsResult.success ? teamsResult.data ?? [] : [];

  const legalServicesResult = await getLegalServiceOptions();
  const legalServices = legalServicesResult.success
    ? legalServicesResult.data ?? []
    : [];

  const users = result.success ? result.data!.data : [];
  const pagination = toPaginationMeta(result.success ? result.data : undefined);

  return (
    <UsersPageContent
      users={users}
      pagination={pagination}
      currentUserId={user.id}
      teams={teams}
      legalServices={legalServices}
    />
  );
}
