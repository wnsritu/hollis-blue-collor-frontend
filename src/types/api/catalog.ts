/** M3 Catalog — Category + ServiceType */

export type Category = {
  id: number;
  name: string;
  service_types?: ServiceType[];
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
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CreateCategoryPayload = {
  name: string;
};

export type UpdateCategoryPayload = {
  name?: string;
};

export type CreateServiceTypePayload = {
  name: string;
  category_id: number;
  is_active?: boolean;
};

export type UpdateServiceTypePayload = {
  name?: string;
  category_id?: number;
  is_active?: boolean;
};

export type ServiceTypeListParams = {
  category_id?: number | string;
  is_active?: boolean | string;
};
