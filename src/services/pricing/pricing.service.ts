import apiClient from "@/services/axios";

export const saveProviderPricingApi = (data: any) => {
  return apiClient.post("/provider/pricing/save", data);
};

export const getProviderPricingApi = (data: any) => {
  return apiClient.post("/provider/provider-pricing", data);
};

export const saveBulkPricingAPI = (data: any) => {
  return apiClient.post("/bulk-price/save", data);
};

export const getBulkPricingAPI = (data: any) => {
  return apiClient.post("/bulk-price/get", data);
};

export const updateCustomPricingAPI = (data: any) => {
  return apiClient.post("booking/update-price", data);
};

export const updateCustomPricingStatusAPI = (data: any) => {
  return apiClient.post("order/update-status", data);
};

export const updateBulkPricingAPI = (data: any) => {
  return apiClient.post("/bulk-price/weight", data);
};

export const getAddonServicesApi = (categoryId?: number) => {
  return apiClient.get("/services/addons", { params: { category_id: categoryId } });
};

export const saveProviderAddonPricingApi = (data: any) => {
  return apiClient.post("/provider/addon-pricing/save", data);
};

export const saveProviderPricing = async (payload: any) => {
  const res = await saveProviderPricingApi(payload);
  return res.data;
};

export const getProviderPricing = async (data: any) => {
  const res = await getProviderPricingApi(data);
  return res.data;
};

export const getAddonServices = async (categoryId?: number) => {
  const res = await getAddonServicesApi(categoryId);
  return res.data;
};

export const saveProviderAddonPricing = async (payload: any) => {
  const res = await saveProviderAddonPricingApi(payload);
  return res.data;
};
