import {
  registerSupportAgentApi,
  getSupportAgentsApi,
  updateSupportAgentApi,
} from "@/api/support.api";

// REGISTER
export const registerSupportAgent = async (payload: any) => {
  const res = await registerSupportAgentApi(payload);
  return res.data;
};

// GET
export const getSupportAgents = async (params: any) => {
  const res = await getSupportAgentsApi(params);
  return res.data;
};

// UPDATE
export const updateSupportAgent = async (id: number, payload: any) => {
  const res = await updateSupportAgentApi(id, payload);
  return res.data;
};
