import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";

/** Matches backend `media.constants.js` */
export type MediaFor = "customer" | "provider" | "admin";
export type MediaType = "image" | "document" | "video";

export type MediaRecord = {
  id?: number;
  name?: string;
  base_path?: string;
  media_type?: string;
  media_for?: string;
  status?: string;
  [key: string]: unknown;
};

/**
 * POST /upload/:mediaFor/:mediaType
 * Form field can be any name (multer `.any()`); we use `file`.
 */
export const uploadApi = {
  uploadMedia: (mediaFor: MediaFor, mediaType: MediaType, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return http.post<ApiSuccess<MediaRecord>>(
      ENDPOINTS.upload.media(mediaFor, mediaType),
      formData
    );
  },

  /** Convenience helpers */
  uploadProviderImage: (file: File) =>
    uploadApi.uploadMedia("provider", "image", file),

  uploadProviderDocument: (file: File) =>
    uploadApi.uploadMedia("provider", "document", file),

  uploadCustomerImage: (file: File) =>
    uploadApi.uploadMedia("customer", "image", file),
};

export default uploadApi;
