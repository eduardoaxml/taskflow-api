import { apiRequest } from "./apiClient";
import type { Organization, PaginatedResponse } from "../types/api";

export interface CreateOrganizationPayload {
  name: string;
  slug: string;
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
