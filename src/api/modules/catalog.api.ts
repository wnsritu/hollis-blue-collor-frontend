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

/**
 * M3 Catalog APIs — preferred over legacy `/services/categories`.
 * Public browse does not require auth.
 */
export const catalogApi = {
  /** Full tree: categories + nested service_types + nested services */
  getTree: () => http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.tree),

  listCategories: () =>
    http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.categories),

  listServiceTypes: (params?: ServiceTypeListParams) =>
    http.get<ApiSuccess<ServiceType[]>>(ENDPOINTS.catalog.serviceTypes, params),

  listServices: (params?: { service_type_id?: number | string; category_id?: number | string }) =>
    http.get<ApiSuccess<ServiceItemModel[]>>(ENDPOINTS.catalog.services, params),

  // ── Admin Categories ──
  createCategory: (payload: CreateCategoryPayload) =>
    http.post<ApiSuccess<Category>>(ENDPOINTS.catalog.adminCategories, payload),

  updateCategory: (id: number | string, payload: UpdateCategoryPayload) =>
    http.put<ApiSuccess<Category>>(ENDPOINTS.catalog.adminCategoryById(id), payload),

  deleteCategory: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.catalog.adminCategoryById(id)),

  // ── Admin Subcategories (Service Types) ──
  createServiceType: (payload: CreateServiceTypePayload) =>
    http.post<ApiSuccess<ServiceType>>(ENDPOINTS.catalog.adminServiceTypes, payload),

  updateServiceType: (id: number | string, payload: UpdateServiceTypePayload) =>
    http.put<ApiSuccess<ServiceType>>(
      ENDPOINTS.catalog.adminServiceTypeById(id),
      payload
    ),

  deleteServiceType: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.catalog.adminServiceTypeById(id)),

  // ── Admin Individual Services ──
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
