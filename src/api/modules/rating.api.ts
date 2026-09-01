import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type { CreateRatingPayload } from "@/types/api/misc";

export const ratingApi = {
  add: (payload: CreateRatingPayload | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.rating.add, payload),

  list: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.list, params),

  listByBooking: (bookingId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.booking(bookingId)),

  listByProvider: (providerId: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.rating.provider(providerId)),
};

export default ratingApi;
