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
    raw?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status ?? 0;
    this.code = params.code;
    this.details = params.details;
    this.raw = params.raw;
    this.isNetworkError = this.status === 0;
    this.isUnauthorized = this.status === 401;
    this.isForbidden = this.status === 403;
    this.isValidationError = this.status === 400 || this.status === 422;
  }
}

export const getErrorMessage = (error: unknown, fallback = "Something went wrong"): string => {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error;
  return fallback;
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
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    error.message ||
    `Request failed (${status})`;

  return new ApiError({
    message: String(message),
    status,
    details: data?.errors ?? data,
    raw: error,
  });
};
