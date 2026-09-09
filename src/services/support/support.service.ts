import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";

export const disputeApi = {
  create: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.dispute.create, payload),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.dispute.list, params),

  getDetails: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.dispute.details(id)),

  updateStatus: (id: number | string, payload: Record<string, unknown>) =>
    http.put<ApiSuccess>(ENDPOINTS.dispute.updateStatus(id), payload),

  addEvidence: (id: number | string, formData: FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.dispute.addEvidence(id), formData),

  resolve: (id: number | string, payload: Record<string, unknown>) =>
    http.post<ApiSuccess>(ENDPOINTS.dispute.resolve(id), payload),
};

// ── Support Agents ──

export const registerSupportAgentApi = (data: any) => {
  return apiClient.post("/support/register-support-agent", data);
};

export const getSupportAgentsApi = (data: any) => {
  return apiClient.post("/support/get-support-agents", data);
};

export const updateSupportAgentApi = (id: number, data: any) => {
  return apiClient.put(`/support/update-support-agent/${id}`, data);
};

export const getAgentDashboard = () => {
  return apiClient.get(`/support/agent/dashboard`);
};

export const registerSupportAgent = async (payload: any) => {
  const res = await registerSupportAgentApi(payload);
  return res.data;
};

export const getSupportAgents = async (params: any) => {
  const res = await getSupportAgentsApi(params);
  return res.data;
};

export const updateSupportAgent = async (id: number, payload: any) => {
  const res = await updateSupportAgentApi(id, payload);
  return res.data;
};

// ── Disputes ──

export const createDisputeApi = (data: FormData) => {
  return apiClient.post("/disputes/create", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getDisputesApi = (data: any) => {
  return apiClient.post("/disputes/list", data);
};

export const getDisputeByIdApi = (id: number) => {
  return apiClient.get(`/disputes/${id}`);
};

export const updateDisputeApi = (id: number, data: FormData) => {
  return apiClient.put(`/disputes/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getDisputeData = (data: any) => {
  return apiClient.post("/disputes/details", data);
};

export const assignAgent = (data: any) => {
  return apiClient.post("/disputes/reassign-agent", data);
};

export const adminFinalDisputeDecision = (data: any) => {
  return apiClient.post("/disputes/admin-review", data);
};

export const addReviewByAgent = (data: any) => {
  return apiClient.post("/disputes/agent-review", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
