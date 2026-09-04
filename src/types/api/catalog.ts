/** M3 Catalog — Category + ServiceType (Subcategory) + ServiceItem */

export type Category = {
  id: number;
  name: string;
  description?: string;
  service_types?: ServiceType[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ServiceItem = {
  id: number;
  name: string;
  service_type_id: number;
  category_id: number;
  service_type?: Pick<ServiceType, "id" | "name">;
  category?: Pick<Category, "id" | "name">;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ServiceType = {
  id: number;
  name: string;
  category_id: number;
  description?: string | null;
  is_active?: boolean;
  category?: Pick<Category, "id" | "name">;
  services?: ServiceItem[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateCategoryPayload = {
  name: string;
  description?: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  description?: string;
};

export type CreateServiceTypePayload = {
  name: string;
  category_id: number;
  is_active?: boolean;
  description?: string;
};

export type UpdateServiceTypePayload = {
  name?: string;
  category_id?: number;
  is_active?: boolean;
  description?: string;
};

export type ServiceTypeListParams = {
  category_id?: number | string;
  is_active?: boolean | string;
};
