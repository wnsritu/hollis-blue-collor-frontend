import { env } from "@/config/env";

/** Build absolute media URL from relative upload path */
export const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = env.assetBaseUrl;
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;
