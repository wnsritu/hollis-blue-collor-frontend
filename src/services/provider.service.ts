import {
  getProviderTimeSlotsApi,
  getServiceTypesApi,
  getTimeSlotsApi,
  pauseProviderApi,
  resumeProviderApi,
  saveProviderSetupApi,
  searchProvidersApi,
  updateProviderProfileApi,
  uploadProviderFileApi,
  verifyProviderApi,
  getProviderPriceApi,
  getProviderSlotsApi,
  addProviderBookApi,
} from "@/api/provider.api";
import { Provider } from "@/types/provider.types";

export const searchProviders = async (payload: any) => {
  const res = await searchProvidersApi(payload);
  return res.data; 
};

export const updateProviderProfile = async (payload) => {
  const res = await updateProviderProfileApi(payload);
  return res.data;
};

export const uploadProviderFile = async (formData) => {
  const res = await uploadProviderFileApi(formData);
  return res.data;
};

// ✅ NEW SERVICE
export const getServiceTypes = async (params?: any) => {
  const res = await getServiceTypesApi(params);

  // 🔥 flexible handling
  return res.data?.data || res.data || [];
};

export const saveProviderSetup = async (payload) => {
  const res = await saveProviderSetupApi(payload);
  return res.data;
};

export const verifyProvider = async (payload: {
  id: number;
  verified: "unverified" | "verified" | "rejected";
}) => {
  const res = await verifyProviderApi(payload);
  return res.data;
};

export const getTimeSlots = async () => {
  const res = await getTimeSlotsApi();
  return res.data?.slots || [];
};


export const getProviderAvailability = async () => {
  const res = await getProviderTimeSlotsApi();

  // return the full object so your useEffect can access status, availability, service_type_ids
  return res.data || {};
};


export const pauseProvider = async (id: number, reason?: string) => {
  const res = await pauseProviderApi(id, reason);
  return res.data;
};

export const resumeProvider = async (id: number) => {
  const res = await resumeProviderApi(id);
  return res.data;
};

export const getProviderPrice = async (data: any) => {
  const res = await getProviderPriceApi(data);
  return res.data;
};

export const getProviderSlots = async (data: any) => {
  const res = await getProviderSlotsApi(data);
  return res.data;
};

export const addProviderBooking = async (data: any) => {
  const res = await addProviderBookApi(data);
  return res.data;
};