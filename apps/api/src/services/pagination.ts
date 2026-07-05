import type { AdminPaginationQuery, PaginatedList } from "@heart-message/shared";

export function paginationOffset(input: AdminPaginationQuery) {
  return (input.page - 1) * input.pageSize;
}

export function createPaginatedList<T>(
  items: T[],
  total: number,
  input: AdminPaginationQuery
): PaginatedList<T> {
  return {
    items,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize))
    }
  };
}
