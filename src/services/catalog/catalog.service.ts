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

export const FALLBACK_CATALOG_TREE: Category[] = [
  {
    id: 1,
    name: "Home Services",
    description: "Trades, maintenance, plumbing, electrical & cleaning for residential properties.",
    is_active: true,
    service_types: [
      {
        id: 101,
        category_id: 1,
        name: "Plumbing",
        description: "Pipe repairs, leak detection, drain cleaning, and fixture installations.",
        is_active: true,
        services: [
          { id: 1001, name: "Drain Clearing & Hydro Jetting", service_type_id: 101, category_id: 1, is_active: true },
          { id: 1002, name: "Water Heater Repair & Install", service_type_id: 101, category_id: 1, is_active: true },
          { id: 1003, name: "Pipe Leak Repair & Fitting", service_type_id: 101, category_id: 1, is_active: true },
        ],
      },
      {
        id: 102,
        category_id: 1,
        name: "Electrical",
        description: "Wiring, panel upgrades, lighting installation, and outlet repairs.",
        is_active: true,
        services: [
          { id: 1004, name: "Recessed & Can Lighting Install", service_type_id: 102, category_id: 1, is_active: true },
          { id: 1005, name: "EV Charger Level 2 Circuit", service_type_id: 102, category_id: 1, is_active: true },
          { id: 1006, name: "Electrical Panel Upgrade (200A)", service_type_id: 102, category_id: 1, is_active: true },
        ],
      },
      {
        id: 103,
        category_id: 1,
        name: "Cleaning",
        description: "Deep house cleaning, move-in/move-out cleans, and carpet washing.",
        is_active: true,
        services: [
          { id: 1007, name: "Deep Home Clean (3 Bedrooms)", service_type_id: 103, category_id: 1, is_active: true },
          { id: 1008, name: "Move-In / Move-Out Sanitation", service_type_id: 103, category_id: 1, is_active: true },
          { id: 1009, name: "Standard Whole-Home Maintenance Clean", service_type_id: 103, category_id: 1, is_active: true },
        ],
      },
      {
        id: 104,
        category_id: 1,
        name: "HVAC & Climate Control",
        description: "AC repair, furnace maintenance, and duct cleaning.",
        is_active: true,
        services: [
          { id: 1010, name: "AC Maintenance & Duct Cleaning", service_type_id: 104, category_id: 1, is_active: true },
          { id: 1011, name: "Smart Thermostat Installation", service_type_id: 104, category_id: 1, is_active: true },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Business Services",
    description: "Commercial IT, office cleaning, security, and facility maintenance.",
    is_active: true,
    service_types: [
      {
        id: 201,
        category_id: 2,
        name: "Office Cleaning",
        description: "Janitorial & commercial office space sanitation.",
        is_active: true,
        services: [
          { id: 2001, name: "Daily Office Janitorial Clean", service_type_id: 201, category_id: 2, is_active: true },
          { id: 2002, name: "Commercial Floor Buffing & Polish", service_type_id: 201, category_id: 2, is_active: true },
        ],
      },
      {
        id: 202,
        category_id: 2,
        name: "IT & Network Setup",
        description: "Office cabling, router setup, server rack assembly, and security cameras.",
        is_active: true,
        services: [
          { id: 2003, name: "Network Rack Wiring & Patch Panel", service_type_id: 202, category_id: 2, is_active: true },
          { id: 2004, name: "CCTV Security System Installation", service_type_id: 202, category_id: 2, is_active: true },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Personal & Outdoor Services",
    description: "Lawn care, tree trimming, pet grooming, and photography.",
    is_active: true,
    service_types: [
      {
        id: 301,
        category_id: 3,
        name: "Lawn & Landscaping",
        description: "Lawn mowing, sprinkler repair, and hedge trimming.",
        is_active: true,
        services: [
          { id: 3001, name: "Weekly Lawn Mowing & Edging", service_type_id: 301, category_id: 3, is_active: true },
          { id: 3002, name: "Sprinkler System Diagnostic & Repair", service_type_id: 301, category_id: 3, is_active: true },
        ],
      },
    ],
  },
];

export const catalogApi = {
  getTree: async () => {
    return { data: FALLBACK_CATALOG_TREE } as any;
  },

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
