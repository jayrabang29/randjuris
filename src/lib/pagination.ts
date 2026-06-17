import type { PaginatedResult } from "@/types";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parsePaginationParams(
  params: { page?: string | number; pageSize?: string | number } = {}
): { page: number; pageSize: number } {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(params.pageSize) || DEFAULT_PAGE_SIZE)
  );
  return { page, pageSize };
}

export function parseNamedPageParam(
  params: Record<string, string | undefined>,
  paramName: string
): number {
  return Math.max(1, Number(params[paramName]) || 1);
}

export function toPaginationMeta<T>(
  result: PaginatedResult<T> | undefined
): PaginationMeta {
  return {
    page: result?.page ?? 1,
    pageSize: result?.pageSize ?? DEFAULT_PAGE_SIZE,
    total: result?.total ?? 0,
    totalPages: result?.totalPages ?? 1,
  };
}
