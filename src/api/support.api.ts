import apiClient from "./axios";


// REGISTER
export const registerSupportAgentApi = (data: any) => {
  return apiClient.post("/support/register-support-agent", data);
};

// GET ALL
export const getSupportAgentsApi = (data: any) => {
  return apiClient.post("/support/get-support-agents", data);
};

// UPDATE
export const updateSupportAgentApi = (id: number, data: any) => {
  return apiClient.put(`/support/update-support-agent/${id}`, data);
};

// UPDATE
export const getAgentDashboard = () => {
  return apiClient.get(`/support/agent/dashboard`);
};
