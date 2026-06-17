import { getDocuments } from "@/actions/documents";
import { getCases } from "@/actions/cases";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentTable } from "@/features/documents/components/document-table";
import { DocumentUpload } from "@/features/documents/components/document-upload";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { getCategoryOptions } from "@/actions/categories";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
}>;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const actor = await requirePermission(PERMISSIONS.documents.read);
  const dbUser = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { teamId: true, team: { select: { name: true } } },
  });

  const [docsResult, casesResult, categoriesResult] = await Promise.all([
    getDocuments({ page, pageSize }),
    getCases({ pageSize: 100 }),
    getCategoryOptions(),
  ]);

  const documents = docsResult.success ? docsResult.data!.data : [];
  const pagination = toPaginationMeta(
    docsResult.success ? docsResult.data : undefined
  );
  const cases = casesResult.success
    ? casesResult.data!.data.map((c) => ({
        id: c.id,
        label: `${c.caseNumber} — ${c.title}`,
      }))
    : [];

  const categories = categoriesResult.success
    ? categoriesResult.data ?? []
    : [];

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Manage case files and legal documents"
        actions={
          <DocumentUpload
            cases={cases}
            categories={categories}
            userTeamId={dbUser?.teamId ?? null}
            userTeamName={dbUser?.team?.name ?? null}
          />
        }
      />
      <DocumentTable documents={documents} pagination={pagination} />
    </div>
  );
}
