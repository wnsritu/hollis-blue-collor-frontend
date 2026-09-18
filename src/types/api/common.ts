/** Shared API contract types */

export type ApiSuccess<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export type PaginatedData<T> = {
  rows?: T[];
  items?: T[];
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type Id = number | string;

export type ApiListParams = PaginationParams & Record<string, unknown>;
