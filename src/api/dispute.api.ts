import api from "./axios";

/* =========================
   CREATE DISPUTE
========================= */
export const createDisputeApi = (data: FormData) => {
  return api.post("/disputes/create", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* =========================
   GET ALL
========================= */
export const getDisputesApi = (data: any) => {
  return api.post("/disputes/list", data);
};

/* =========================
   GET ONE
========================= */
export const getDisputeByIdApi = (id: number) => {
  return api.get(`/disputes/${id}`);
};

/* =========================
   UPDATE
========================= */
export const updateDisputeApi = (id: number, data: FormData) => {
  return api.put(`/disputes/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Dispute Details
export const getDisputeData = (data: any) => {
  return api.post("/disputes/details", data);
};

// Assign Agent
export const assignAgent = (data: any) => {
  return api.post("/disputes/reassign-agent", data);
};

// Admin Final Decision
export const adminFinalDisputeDecision = (data: any) => {
  return api.post("/disputes/admin-review", data);
};

// Agent Review
export const addReviewByAgent = (data: any) => {
  return api.post("/disputes/agent-review", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
