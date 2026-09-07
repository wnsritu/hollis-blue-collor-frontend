import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "./client";
import { isFormData } from "@/utils/mediaUrl";

export type RequestConfig = AxiosRequestConfig;

/**
 * Thin typed wrappers around axios — use these from feature API modules.
 * Always return `response.data` so callers stay DRY.
 */
async function request<T>(
  method: "get" | "delete" | "post" | "put" | "patch",
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<T> {
  const headers = { ...(config?.headers ?? {}) } as Record<string, string>;

  if (data && isFormData(data)) {
    // Let the browser set multipart boundary
    delete headers["Content-Type"];
  } else if (data != null && method !== "get" && method !== "delete") {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const response: AxiosResponse<T> = await apiClient.request<T>({
    ...config,
    method,
    url,
    data: method === "get" || method === "delete" ? undefined : data,
    params: method === "get" || method === "delete" ? data ?? config?.params : config?.params,
    headers,
  });

  return response.data;
}

export const http = {
  get: <T>(url: string, params?: unknown, config?: RequestConfig) =>
    request<T>("get", url, params, config),

  delete: <T>(url: string, params?: unknown, config?: RequestConfig) =>
    request<T>("delete", url, params, config),

  post: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>("post", url, data, config),

  put: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>("put", url, data, config),

  patch: <T>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>("patch", url, data, config),
};

export default http;
