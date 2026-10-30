import type { PaginatedResponse } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export async function getAllPages<T>(
  path: string,
  request: AuthenticatedRequest,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const separator = path.includes("?") ? "&" : "?";

    const response = await request<PaginatedResponse<T>>(
      `${path}${separator}page=${page}`,
    );

    results.push(...response.results);

    hasNextPage = response.next !== null;
    page += 1;
  }

  return results;
}
