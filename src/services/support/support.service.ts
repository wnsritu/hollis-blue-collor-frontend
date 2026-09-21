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

export const getSupportAgentsApi = (_params?: any) => {
  return apiClient.get("/disputes/agents");
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

export const getSupportAgents = async (params?: any) => {
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

export const getDisputesApi = (params?: any) => {
  return apiClient.get("/disputes/list", { params });
};

export const getDisputeByIdApi = (id: number | string) => {
  return apiClient.get(`/disputes/details/${id}`);
};

export const updateDisputeApi = (id: number | string, data: FormData) => {
  return apiClient.put(`/disputes/update-status/${id}`, data);
};

export const getDisputeData = (data: any) => {
  const disputeId = typeof data === "object" ? (data.id || data.dispute_id || data.booking_id) : data;
  return apiClient.get(`/disputes/details/${disputeId}`);
};

export const assignAgent = (data: any) => {
  const disputeId = data.dispute_id || data.id;
  return apiClient.put(`/disputes/update-status/${disputeId}`, {
    agent_id: data.agent_id || data.agentId,
  });
};

export const adminFinalDisputeDecision = (data: any) => {
  const disputeId = data.dispute_id || data.id;
  return apiClient.put(`/disputes/update-status/${disputeId}`, {
    status: data.status || (data.decision === "reject_dispute" ? "rejected" : "resolved"),
    admin_decision: data.admin_decision || data.decision,
    resolution_notes: data.resolution_notes || data.notes || data.admin_note || null,
    refund_amount: data.refund_amount || null,
  });
};

export const addReviewByAgent = (data: any) => {
  return apiClient.post("/disputes/agent-review", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
