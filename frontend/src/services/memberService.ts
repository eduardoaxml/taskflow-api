import type { OrganizationMember, PaginatedResponse } from "../types/api";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export async function getOrganizationMembers(
  organizationId: string,
  request: AuthenticatedRequest,
): Promise<PaginatedResponse<OrganizationMember>> {
  return request<PaginatedResponse<OrganizationMember>>(
    `organizations/${organizationId}/members/`,
  );
}
