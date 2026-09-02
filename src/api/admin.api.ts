import api from "./axios";

export const getAdminDashboardApi = () => {
  return api.get("/admin/dashboard");
};
export const getAllPlans = () => {
  return api.get("/admin/plans/all");
};
export const getAllProviderPlans = (data: any) => {
  return api.post("/subscriptions/all-provider-plan", data);
};
export const updatePlans = (data: any) => {
  return api.put("/admin/plans/update", data);
};
export const approvePlanByAdmin = () => {
  return api.get("/approve-plan/:id");
};
export const getAllProvider = (data: any) => {
  return api.post("/provider/get-all-provider", data);
};

export const getAllCoinHistory = (data: any) => {
  return api.post("/coins/history", data);
};

export const addUpdateCoins = (data: any) => {
  return api.post("/coins/manage", data);
};



export const updateProfile = async (payload: any) => {
  const res = await api.put("/user/update-profile", payload);
  return res.data;
};

export const uploadProfilePhotoApi = async (file: File) => {
  const formData = new FormData();
  formData.append("profile_photo", file);
  // Let the browser set multipart boundary — do not force Content-Type
  const res = await api.put("/user/profile/photo", formData);
  return res.data;
};

export const getPlatformSettings = async () => {
  const res = await api.get("/admin/platform-settings");
  return res.data;
};

export const updatePlatformSettings = async (payload: any) => {
  const res = await api.put("/admin/platform-settings", payload);
  return res.data;
};