import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  CreateProjectPayload,
  Project,
  UpdateProjectPayload,
  UpdateProjectStatusPayload,
} from "@/types/api/project";
import type { ProjectMatch, RespondToMatchPayload } from "@/types/api/matching";

export const projectApi = {
  create: (payload: CreateProjectPayload) =>
    http.post<ApiSuccess<Project>>(ENDPOINTS.project.root, payload),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess<Project[]>>(ENDPOINTS.project.root, params),

  listMine: (params?: ApiListParams) =>
    http.get<ApiSuccess<Project[]>>(ENDPOINTS.project.customerMy, params),

  /** Matched opportunities for provider (prefer over dumping all open projects) */
  listProviderFeed: (params?: ApiListParams) =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.providerFeed, params),

  getById: (id: number | string) =>
    http.get<ApiSuccess<Project>>(ENDPOINTS.project.byId(id)),

  update: (id: number | string, payload: UpdateProjectPayload) =>
    http.put<ApiSuccess<Project>>(ENDPOINTS.project.byId(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.project.byId(id)),

  updateStatus: (id: number | string, payload: UpdateProjectStatusPayload) =>
    http.patch<ApiSuccess<Project>>(ENDPOINTS.project.status(id), payload),

  addAttachment: (id: number | string, formData: FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.project.attachments(id), formData),

  removeAttachment: (id: number | string, fileId: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.project.attachmentById(id, fileId)),

  // ── Matching helpers (also on matchingApi) ──
  runMatching: (id: number | string) =>
    http.post<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.runMatch(id)),

  listMatches: (id: number | string) =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.matches(id)),

  respondToMatch: (id: number | string, payload: RespondToMatchPayload) =>
    http.post<ApiSuccess<ProjectMatch>>(ENDPOINTS.project.matchRespond(id), payload),
};

export default projectApi;
