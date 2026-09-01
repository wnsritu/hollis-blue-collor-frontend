import api from "./axios";

export const saveProviderPricingApi = (data) => {
  return api.post("/provider/pricing/save", data);
};

// export const getProviderPricingApi = () => {
//   return api.get("/provider/pricing");
// };

export const getProviderPricingApi = (data: any) => {
  return api.post("/provider/provider-pricing", data);
};

export const saveBulkPricingAPI = (data: any) => {
  return api.post("/bulk-price/save", data);
};

export const getBulkPricingAPI = (data: any) => {
  return api.post("/bulk-price/get", data);
};

export const updateCustomPricingAPI = (data: any) => {
  return api.post("booking/update-price", data);
};

export const updateCustomPricingStatusAPI = (data: any) => {
  return api.post("order/update-status", data);
};

export const updateBulkPricingAPI = (data: any) => {
  return api.post("/bulk-price/weight", data);
};

export const getAddonServicesApi = (categoryId?: number) => {
  return api.get("/services/addons", { params: { category_id: categoryId } });
};

export const saveProviderAddonPricingApi = (data: any) => {
  return api.post("/provider/addon-pricing/save", data);
};