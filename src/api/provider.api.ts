import api from "./axios";

export const searchProvidersApi = (data: any) => {
  return api.post("/provider/search/miles", data);
};

export const updateProviderProfileApi = (data: any) => {
  return api.put("/user/provider/profile", data);
};

export const uploadProviderFileApi = (formData: any) => {
  return api.put("/user/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ✅ NEW API
export const getServiceTypesApi = (params?: any) => {
  return api.get("/services/service-types", { params });
};

export const saveProviderSetupApi = (data: any) => {
  return api.post("/provider-availability/setup", data);
};

export const verifyProviderApi = (data: {
  id: number;
  verified: "unverified" | "verified" | "rejected";
}) => {
  return api.put("/provider/verify-provider", data);
};

export const getTimeSlotsApi = () => {
  return api.get("/time-slots");
};

export const getProviderTimeSlotsApi = () => {
  return api.get("/provider-availability");
};

export const pauseProviderApi = (id: number, reason?: string) => {
  return api.patch(`/provider/${id}/pause`, { reason });
};

export const resumeProviderApi = (id: number) => {
  return api.patch(`/provider/${id}/resume`);
};

export const getProviderPriceApi = (data: any) => {
  return api.post("/provider/provider-pricing", data);
};

export const getProviderSlotsApi = (data: any) => {
  return api.post("/provider-availability/get-slots", data);
};
// export const addProviderBookApi = (data: any) => {
//   return api.post("/booking/add", data);
// };
export const addProviderBookApi = (data: any) => {
  return api.post("/booking/add", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const addPhotoInBookingApi = (data: any) => {
  return api.post("/order/update-status", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getProviderServiceAmount = () => {
  return api.get("/provider-availability/services");
};
export const addProviderServiceAmount = (data: any) => {
  return api.put("/provider-availability/services", data);
};

export const getProviderData = (data: any) => {
  return api.post("/provider/get-provider", data);
};

export const getAllSlots = () => {
  return api.get("/time-slots");
};

export const selectPlan = (data: any) => {
  return api.post("/provider/select-plan", data);
};

export const getWalletCoins = () => {
  return api.get("/coins/my-wallet");
};

export const getMyPlan = () => {
  return api.get("/subscriptions/my-subscription");
};
