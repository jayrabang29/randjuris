import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";
import { getCases } from "@/actions/cases";
import { ClientProfile } from "@/features/clients/components/client-profile";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
}>;

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { page, pageSize } = parsePaginationParams(sp);

  const [clientResult, casesResult] = await Promise.all([
    getClient(id),
    getCases({ clientId: id, page, pageSize }),
  ]);

  if (!clientResult.success || !clientResult.data) {
    notFound();
  }

  const cases = casesResult.success ? casesResult.data!.data : [];
  const casesPagination = toPaginationMeta(
    casesResult.success ? casesResult.data : undefined
  );

  return (
    <ClientProfile
      client={clientResult.data}
      cases={cases}
      casesPagination={casesPagination}
    />
  );
}
