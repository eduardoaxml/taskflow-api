import { apiRequest } from "./apiClient";
import type {
  Organization,
  OrganizationMember,
  PaginatedResponse,
} from "../types/api";

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
}

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
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await getOrganizationMembers(
      organizationId,
      request,
      page,
    );

    members.push(...response.results);

    hasNextPage = response.next !== null;
    page += 1;
  }

  return members;
}

export function getOrganizations(
  accessToken: string,
): Promise<PaginatedResponse<Organization>> {
  return apiRequest<PaginatedResponse<Organization>>(
    "organizations/",
    {},
    accessToken,
  );
}

export function createOrganization(
  accessToken: string,
  payload: CreateOrganizationPayload,
): Promise<Organization> {
  return apiRequest<Organization>(
    "organizations/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}
