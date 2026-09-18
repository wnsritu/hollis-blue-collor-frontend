/**
 * Environment-based configuration.
 * Prefer importing from here instead of reading import.meta.env directly.
 */

const rawApiBase = (import.meta.env.VITE_BASE_URL as string | undefined)?.trim() ?? "";
const rawAssetBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";

/** Normalize trailing slash */
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * Axios base URL must point at the versioned API root, e.g.
 * `http://localhost:5000/api/v1`
 */
function resolveApiBaseUrl(value: string): string {
  if (!value) return "";
  const base = stripTrailingSlash(value);
  // Allow either `/api` or `/api/v1` in env; prefer `/api/v1`
  if (base.endsWith("/api/v1")) return base;
  if (base.endsWith("/api")) return `${base}/v1`;
  return base;
}

export const env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  /** Backend REST API (includes /api/v1) */
  apiBaseUrl: resolveApiBaseUrl(rawApiBase),

  /** Static/media host (uploads, profile images) */
  assetBaseUrl: stripTrailingSlash(rawAssetBase || rawApiBase.replace(/\/api(?:\/v1)?$/, "")),

  stripePublishableKey: (import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined) ?? "",
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? "",
  googleMapsApiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "",
} as const;

export type AppEnv = typeof env;

export default env;
