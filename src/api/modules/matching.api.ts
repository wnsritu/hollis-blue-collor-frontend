import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type { ProjectMatch, RespondToMatchPayload } from "@/types/api/matching";

/**
 * M3 Matching / leads APIs.
 * Prefer `matchingApi` for match-specific UI; project feed also available on projectApi.
 */
export const matchingApi = {
  /** Manually (re)run matching for a project */
  runForProject: (projectId: number | string) =>
    http.post<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.runMatch(projectId)),

  /** Customer/admin: ranked matches for a project */
  listForProject: (projectId: number | string) =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.matches(projectId)),

  /** Provider: respond to a lead */
  respond: (projectId: number | string, payload: RespondToMatchPayload) =>
    http.post<ApiSuccess<ProjectMatch>>(
      ENDPOINTS.project.matchRespond(projectId),
      payload
    ),

  /** Provider: my matched leads */
  listMyLeads: () =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.marketplaceProvider.leads),
};

export default matchingApi;
