import type { OrganizationMember, PaginatedResponse } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export function getOrganizationMembers(
  organizationId: string,
  request: AuthenticatedRequest,
  page = 1,
): Promise<PaginatedResponse<OrganizationMember>> {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  const endpoint = `organizations/${organizationId}/members/`;
  const queryString = params.toString();

  return request<PaginatedResponse<OrganizationMember>>(
    queryString ? `${endpoint}?${queryString}` : endpoint,
  );
}

export async function getAllOrganizationMembers(
  organizationId: string,
  request: AuthenticatedRequest,
): Promise<OrganizationMember[]> {
  const members: OrganizationMember[] = [];
  const visitedPages = new Set<number>();
  let page = 1;

  while (true) {
    if (visitedPages.has(page)) {
      throw new Error("Invalid pagination response.");
    }

    visitedPages.add(page);

    const response = await getOrganizationMembers(
      organizationId,
      request,
      page,
    );

    members.push(...response.results);

    if (response.next === null) {
      break;
    }

    page += 1;
  }

  return members;
}
