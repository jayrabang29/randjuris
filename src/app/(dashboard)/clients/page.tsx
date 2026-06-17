import { getClients } from "@/actions/clients";
import { ClientsPageContent } from "@/features/clients/components/clients-page-content";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";

type SearchParams = Promise<{
  search?: string;
  clientType?: string;
  page?: string;
  pageSize?: string;
}>;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const result = await getClients({
    search: params.search,
    clientType: params.clientType as "INDIVIDUAL" | "CORPORATE" | undefined,
    page,
    pageSize,
  });

  const clients = result.success ? result.data!.data : [];
  const pagination = toPaginationMeta(result.success ? result.data : undefined);

  return <ClientsPageContent clients={clients} pagination={pagination} />;
}
