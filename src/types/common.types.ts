import type { ReactNode } from "react";

export type StatusType = "idle" | "loading" | "success" | "error";

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BaseOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface WithChildren {
  children: ReactNode;
}

export interface WithClassName {
  className?: string;
}
