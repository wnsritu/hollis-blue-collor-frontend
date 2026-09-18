import type { AxiosError } from "axios";

export type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: unknown;
  success?: boolean;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  /** Original API JSON body when present */
  body?: ApiErrorBody | null;
  raw?: unknown;
  isNetworkError: boolean;
  isUnauthorized: boolean;
  isForbidden: boolean;
  isValidationError: boolean;

  constructor(params: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    body?: ApiErrorBody | null;
    raw?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status ?? 0;
    this.code = params.code;
    this.details = params.details;
    this.body = params.body ?? null;
    this.raw = params.raw;
    this.isNetworkError = this.status === 0;
    this.isUnauthorized = this.status === 401;
    this.isForbidden = this.status === 403;
    this.isValidationError = this.status === 400 || this.status === 422;
  }
}

/** Safely extract human-readable string message from any value */
export function extractStringMessage(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed && trimmed !== "[object Object]") return trimmed;
    return null;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;

    if (typeof obj.message === "string" && obj.message && obj.message !== "[object Object]") {
      return obj.message;
    }
    if (typeof obj.error === "string" && obj.error && obj.error !== "[object Object]") {
      return obj.error;
    }

    if (obj.message) {
      const nested = extractStringMessage(obj.message);
      if (nested) return nested;
    }
    if (obj.error) {
      const nested = extractStringMessage(obj.error);
      if (nested) return nested;
    }
  }
  return null;
}

export const getErrorMessage = (error: unknown, fallback = "Something went wrong"): string => {
  if (!error) return fallback;

  if (typeof error === "string" && error.trim() && error !== "[object Object]") {
    return error.trim();
  }

  if (error instanceof ApiError) {
    if (error.message && error.message !== "[object Object]") return error.message;
  }

  if (error instanceof Error) {
    if (error.message && error.message !== "[object Object]") return error.message;
  }

  const extracted = extractStringMessage(error);
  if (extracted) return extracted;

  return fallback;
};

/** Read a field from ApiError body / Axios response / plain object */
export const getErrorField = <T = unknown>(error: unknown, key: string): T | undefined => {
  if (error instanceof ApiError) {
    const fromBody = error.body?.[key];
    if (fromBody !== undefined) return fromBody as T;
    if (error.details && typeof error.details === "object" && key in (error.details as object)) {
      return (error.details as Record<string, unknown>)[key] as T;
    }
    const axiosData = (error.raw as { response?: { data?: Record<string, unknown> } })
      ?.response?.data;
    if (axiosData && key in axiosData) return axiosData[key] as T;
  }
  const ax = error as { response?: { data?: Record<string, unknown> } };
  if (ax?.response?.data && key in ax.response.data) {
    return ax.response.data[key] as T;
  }
  return undefined;
};

export const normalizeAxiosError = (error: AxiosError<ApiErrorBody>): ApiError => {
  if (!error.response) {
    return new ApiError({
      message: error.message || "Network error. Please check your connection.",
      status: 0,
      raw: error,
    });
  }

  const { status, data } = error.response;

  const message =
    extractStringMessage(data?.message) ||
    extractStringMessage(data?.error) ||
    extractStringMessage(data) ||
    extractStringMessage(error.message) ||
    `Request failed (${status})`;

  return new ApiError({
    message,
    status,
    details: data?.errors ?? data,
    body: typeof data === "object" && data ? data : null,
    raw: error,
  });
};
