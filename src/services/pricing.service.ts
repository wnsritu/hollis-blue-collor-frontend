import {
  getProviderPricingApi,
  saveProviderPricingApi,
  getAddonServicesApi,
  saveProviderAddonPricingApi,
} from "@/api/pricing.api";

export const saveProviderPricing = async (payload) => {
  const res = await saveProviderPricingApi(payload);
  return res.data;
};

// export const getProviderPricing = async () => {
//   const res = await getProviderPricingApi();
//   return res.data;
// };

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