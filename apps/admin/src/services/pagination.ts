import type { PaginationMeta } from "@heart-message/shared";

export const adminPageSizes = [10, 20, 50, 100];

export function createPaginationState(pageSize = 20): PaginationMeta {
  return {
    page: 1,
    pageSize,
    total: 0,
    pageCount: 1
  };
}

export function paginationQuery(pagination: PaginationMeta) {
  const query = new URLSearchParams({
    page: String(pagination.page),
    pageSize: String(pagination.pageSize)
  });

  return query.toString();
}

export function listQuery(
  pagination: PaginationMeta,
  filters: Record<string, string | number | boolean | undefined>
) {
  const query = new URLSearchParams(paginationQuery(pagination));

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }

  return query.toString();
}

export function applyPagination(target: PaginationMeta, source: PaginationMeta) {
  Object.assign(target, source);
}
