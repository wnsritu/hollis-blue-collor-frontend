import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  Category,
  CreateCategoryPayload,
  CreateServiceTypePayload,
  ServiceType,
  ServiceTypeListParams,
  UpdateCategoryPayload,
  UpdateServiceTypePayload,
} from "@/types/api/catalog";

export interface ServiceItemModel {
  id: number;
  name: string;
  service_type_id: number;
  category_id: number;
  service_type?: ServiceType;
  category?: Category;
}

export interface CreateServiceItemPayload {
  name: string;
  service_type_id: number;
  category_id: number;
}

export interface UpdateServiceItemPayload {
  name?: string;
  service_type_id?: number;
  category_id?: number;
}

export const getItemsAPI = async (payload: {
  page: number;
  limit: number;
  search: string;
  category_id?: number;
}) => {
  const res = await apiClient.post("/items/list", payload);
  return res.data;
};

export const getServicesAPI = async (payload: {
  page: number;
  limit: number;
  search: string;
  category_id?: number;
}) => {
  const res = await apiClient.post("/services/list", payload);
  return res.data;
};

export const getCleaningConfigAPI = async () => {
  const res = await apiClient.get("/services/cleaning-config");
  return res.data;
};

export const getItems = async (payload?: any) => {
  try {
    const res = await getItemsAPI({
      page: 1,
      limit: 50,
      search: "",
      ...payload,
    });
    return res;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const getServices = async (payload?: any) => {
  try {
    const res = await getServicesAPI({
      page: 1,
      limit: 50,
      search: "",
      ...payload,
    });
    return res;
  } catch (err: any) {
    throw err;
  }
};

export const getCleaningConfig = async () => {
  try {
    const res = await getCleaningConfigAPI();
    return res.data;
  } catch (err: any) {
    throw err;
  }
};

export const catalogApi = {
  getTree: () => http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.tree),

  listCategories: () =>
    http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.categories),

  getCategories: () =>
    http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.categories),

  listServiceTypes: (params?: ServiceTypeListParams) =>
    http.get<ApiSuccess<ServiceType[]>>(ENDPOINTS.catalog.serviceTypes, params),

  listServices: (params?: { service_type_id?: number | string; category_id?: number | string }) =>
    http.get<ApiSuccess<ServiceItemModel[]>>(ENDPOINTS.catalog.services, params),

  createCategory: (payload: CreateCategoryPayload) =>
    http.post<ApiSuccess<Category>>(ENDPOINTS.catalog.adminCategories, payload),

  updateCategory: (id: number | string, payload: UpdateCategoryPayload) =>
    http.put<ApiSuccess<Category>>(ENDPOINTS.catalog.adminCategoryById(id), payload),

  deleteCategory: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.catalog.adminCategoryById(id)),

  createServiceType: (payload: CreateServiceTypePayload) =>
    http.post<ApiSuccess<ServiceType>>(ENDPOINTS.catalog.adminServiceTypes, payload),

  updateServiceType: (id: number | string, payload: UpdateServiceTypePayload) =>
    http.put<ApiSuccess<ServiceType>>(
      ENDPOINTS.catalog.adminServiceTypeById(id),
      payload
    ),

  deleteServiceType: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.catalog.adminServiceTypeById(id)),

  createService: (payload: CreateServiceItemPayload) =>
    http.post<ApiSuccess<ServiceItemModel>>(ENDPOINTS.catalog.adminServices, payload),

  updateService: (id: number | string, payload: UpdateServiceItemPayload) =>
    http.put<ApiSuccess<ServiceItemModel>>(
      ENDPOINTS.catalog.adminServiceById(id),
      payload
    ),

  deleteService: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.catalog.adminServiceById(id)),
};

export default catalogApi;
