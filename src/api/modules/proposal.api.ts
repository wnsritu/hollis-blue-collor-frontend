import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  CreateProposalPayload,
  Proposal,
  UpdateProposalPayload,
} from "@/types/api/proposal";

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

export default proposalApi;
