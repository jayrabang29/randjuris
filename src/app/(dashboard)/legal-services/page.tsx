import { getLegalServicesPaginated } from "@/actions/legal-services";
import { LegalServicesPageContent } from "@/features/legal-services/components/legal-services-page-content";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";

type SearchParams = Promise<{
  search?: string;
  page?: string;
  pageSize?: string;
}>;

export default async function LegalServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(PERMISSIONS.legal_services.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const result = await getLegalServicesPaginated({
    search: params.search,
    page,
    pageSize,
  });

  const services = result.success ? result.data!.data : [];
  const pagination = toPaginationMeta(result.success ? result.data : undefined);

  return (
    <LegalServicesPageContent
      services={services}
      pagination={pagination}
    />
  );
}
