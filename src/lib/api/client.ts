import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { attachInterceptors } from "./interceptors";

const DEFAULT_TIMEOUT_MS = 30_000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

attachInterceptors(apiClient);

/** Escape hatch for one-off configs (upload progress, longer timeout, etc.) */
export const createApiClient = (config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: DEFAULT_TIMEOUT_MS,
    ...config,
  });
  attachInterceptors(instance);
  return instance;
};

export default apiClient;
