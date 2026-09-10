import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  CreateProjectPayload,
  Project,
  RequestQuotePayload,
  UpdateProjectPayload,
  UpdateProjectStatusPayload,
} from "@/types/api/project";
import type { ProjectMatch, RespondToMatchPayload } from "@/types/api/matching";
import type {
  CreateProposalPayload,
  Proposal,
  UpdateProposalPayload,
} from "@/types/api/proposal";

export const projectApi = {
  create: (payload: CreateProjectPayload) =>
    http.post<ApiSuccess<Project>>(ENDPOINTS.project.root, payload),

  requestQuote: (providerId: number | string, payload: RequestQuotePayload) =>
    http.post<ApiSuccess<Project>>(
      ENDPOINTS.marketplaceProvider.requestQuote(providerId),
      payload
    ),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess<Project[]>>(ENDPOINTS.project.root, params),

  listMine: (params?: ApiListParams) =>
    http.get<ApiSuccess<Project[]>>(ENDPOINTS.project.customerMy, params),

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

  runMatching: (id: number | string) =>
    http.post<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.runMatch(id)),

  listMatches: (id: number | string) =>
    http.get<ApiSuccess<ProjectMatch[]>>(ENDPOINTS.project.matches(id)),

  respondToMatch: (id: number | string, payload: RespondToMatchPayload) =>
    http.post<ApiSuccess<ProjectMatch>>(ENDPOINTS.project.matchRespond(id), payload),
};

export const proposalApi = {
  createForProject: (projectId: number | string, payload: CreateProposalPayload) =>
    http.post<ApiSuccess<Proposal>>(
      ENDPOINTS.proposal.projectProposals(projectId),
      payload
    ),

  listForProject: (projectId: number | string) =>
    http.get<ApiSuccess<Proposal[]>>(ENDPOINTS.proposal.projectProposals(projectId)),

  listMine: () => http.get<ApiSuccess<Proposal[]>>(ENDPOINTS.proposal.providerMy),

  getById: (id: number | string) =>
    http.get<ApiSuccess<Proposal>>(ENDPOINTS.proposal.byId(id)),

  update: (id: number | string, payload: UpdateProposalPayload) =>
    http.put<ApiSuccess<Proposal>>(ENDPOINTS.proposal.byId(id), payload),

  remove: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.proposal.byId(id)),

  accept: (id: number | string) =>
    http.post<ApiSuccess<Proposal>>(ENDPOINTS.proposal.accept(id)),

  reject: (id: number | string) =>
    http.post<ApiSuccess<Proposal>>(ENDPOINTS.proposal.reject(id)),

  expire: (id: number | string) =>
    http.post<ApiSuccess<Proposal>>(ENDPOINTS.proposal.expire(id)),
};

export type MediaFor = "customer" | "provider" | "admin";
export type MediaType = "image" | "document" | "video";

export type MediaRecord = {
  id?: number;
  name?: string;
  base_path?: string;
  media_type?: string;
  media_for?: string;
  status?: string;
  [key: string]: unknown;
};

export const uploadApi = {
  uploadMedia: (mediaFor: MediaFor, mediaType: MediaType, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post<ApiSuccess<MediaRecord>>(
      ENDPOINTS.upload.media(mediaFor, mediaType),
      formData
    );
  },

  uploadProviderImage: (file: File) =>
    uploadApi.uploadMedia("provider", "image", file),

  uploadProviderDocument: (file: File) =>
    uploadApi.uploadMedia("provider", "document", file),

  uploadCustomerImage: (file: File) =>
    uploadApi.uploadMedia("customer", "image", file),
};

export default projectApi;
