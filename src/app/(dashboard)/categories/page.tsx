import { getCategoriesPaginated } from "@/actions/categories";
import { CategoriesPageContent } from "@/features/categories/components/categories-page-content";
import { parsePaginationParams, toPaginationMeta } from "@/lib/pagination";
import { requirePermission } from "@/lib/session";
import { PERMISSIONS } from "@/lib/permissions";

type SearchParams = Promise<{
  search?: string;
  page?: string;
  pageSize?: string;
}>;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(PERMISSIONS.categories.read);
  const params = await searchParams;
  const { page, pageSize } = parsePaginationParams(params);

  const result = await getCategoriesPaginated({
    search: params.search,
    page,
    pageSize,
  });

  const categories = result.success ? result.data!.data : [];
  const pagination = toPaginationMeta(result.success ? result.data : undefined);

  return (
    <CategoriesPageContent
      categories={categories}
      pagination={pagination}
    />
  );
}
