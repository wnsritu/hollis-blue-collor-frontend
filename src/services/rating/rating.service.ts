import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type { CreateRatingPayload } from "@/types/api/misc";

export const addRatingApi = (data: {
  booking_id: number;
  rating: number;
  comment?: string;
}) => {
  return apiClient.post("/ratings/ratings", data);
};

export const getAllRatingsApi = (data: {
  provider_id?: number;
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  return apiClient.post("/ratings/all", data);
};

export const getAverageRatingApi = (provider_id: number) => {
  return apiClient.get(`/ratings/ratings/${provider_id}/avg`);
};

export const updateRatingApi = (id: number, data: any) => {
  return apiClient.put(`/ratings/ratings/${id}`, data);
};

export const deleteRatingApi = (id: number) => {
  return apiClient.delete(`/ratings/ratings/${id}`);
};

export const ratingApi = {
  add: (payload: CreateRatingPayload | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.rating.add, payload),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.list, params),

  listByBooking: (bookingId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.booking(bookingId)),

  listByProvider: (providerId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.provider(providerId)),

  provider: (providerId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.provider(providerId)),

  adminList: (params?: any) =>
    http.get<ApiSuccess>("/admin/reviews", params),

  moderate: (id: number | string, payload: { action: string; note?: string }) =>
    http.post<ApiSuccess>(`/admin/reviews/${id}/moderate`, payload),
};

export default {
  addRatingApi,
  getAllRatingsApi,
  getAverageRatingApi,
  updateRatingApi,
  deleteRatingApi,
  ratingApi,
};
