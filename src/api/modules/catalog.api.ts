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

/**
 * M3 Catalog APIs — preferred over legacy `/services/categories`.
 * Public browse does not require auth.
 */
export const catalogApi = {
  /** Full tree: categories + nested service_types */
  getTree: () => http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.tree),

  listCategories: () =>
    http.get<ApiSuccess<Category[]>>(ENDPOINTS.catalog.categories),

  listServiceTypes: (params?: ServiceTypeListParams) =>
    http.get<ApiSuccess<ServiceType[]>>(ENDPOINTS.catalog.serviceTypes, params),

  // ── Admin ──
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
};

export default catalogApi;
