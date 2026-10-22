import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { ENDPOINTS } from "@/constants/endpoints";
import { tokenStorage } from "@/utils/tokenStorage";
import { normalizeAxiosError } from "./errors";
import { attachMilestoneGateInterceptor } from "@/lib/milestoneGate";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

type AuthEvents = {
  onUnauthorized?: () => void;
};

const events: AuthEvents = {};

/** Register logout / redirect handler (call once from app bootstrap) */
export const setApiAuthHandlers = (handlers: AuthEvents) => {
  Object.assign(events, handlers);
};

async function refreshAccessToken(client: AxiosInstance): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const { data } = await client.post(
    ENDPOINTS.auth.refreshToken,
    { refreshToken },
    { headers: { Authorization: undefined } }
  );

  const payload = data?.data ?? data;
  const accessToken: string | undefined =
    payload?.accessToken || payload?.token || data?.accessToken || data?.token;
  const nextRefresh: string | undefined =
    payload?.refreshToken || data?.refreshToken || refreshToken;

  if (!accessToken) return null;

  tokenStorage.setTokens(accessToken, nextRefresh);
  return accessToken;
}

export const attachInterceptors = (client: AxiosInstance) => {
  attachMilestoneGateInterceptor(client);

  client.interceptors.request.use((config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const respData = error.response?.data;
      const errorCode = respData?.code;
      const errorMessage = String(respData?.message || "").toLowerCase();

      const isAccountSuspended =
        errorCode === "ACCOUNT_SUSPENDED" ||
        errorCode === "ACCOUNT_DEACTIVATED" ||
        respData?.is_suspended === true ||
        errorMessage.includes("account has been suspended") ||
        errorMessage.includes("account is currently suspended") ||
        errorMessage.includes("account has been deactivated");

      if (isAccountSuspended || (status === 401 && original && !original._retry)) {
        const url = String(original?.url ?? "");
        const isAuthRoute =
          url.includes("/auth/login") ||
          url.includes("/auth/register") ||
          url.includes("/auth/refresh-token");

        // If explicitly suspended, do not attempt token refresh - expire immediately
        if (!isAccountSuspended && !isAuthRoute && tokenStorage.getRefreshToken()) {
          original._retry = true;
          try {
            refreshPromise =
              refreshPromise ??
              refreshAccessToken(client).finally(() => {
                refreshPromise = null;
              });
            const newToken = await refreshPromise;
            if (newToken) {
              original.headers.set("Authorization", `Bearer ${newToken}`);
              return client(original);
            }
          } catch {
            /* fall through to clear session */
          }
        }

        tokenStorage.clearSession();
        events.onUnauthorized?.();
      }

      return Promise.reject(
        axios.isAxiosError(error) ? normalizeAxiosError(error) : error
      );
    }
  );
};
