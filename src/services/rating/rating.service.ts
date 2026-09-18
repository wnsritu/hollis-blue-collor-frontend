import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type { CreateRatingPayload } from "@/types/api/misc";

const FALLBACK_SEED_REVIEWS = [
  {
    id: 1,
    booking_id: 1003,
    booking_number: "BK-2026-8803",
    rating: 5,
    comment: "Outstanding electrical service! The technician arrived right on time, replaced our commercial breaker panel efficiently, and explained all safety procedures clearly.",
    service_name: "Electrical Panel Upgrade",
    provider_name: "Apex Electrical Solutions",
    provider: { id: 201, name: "Apex Electrical Solutions", business_name: "Apex Electrical Solutions" },
    customer_name: "Sarah Whitfield",
    customer: { id: 101, full_name: "Sarah Whitfield" },
    created_at: "2026-09-16T14:30:00Z",
  },
  {
    id: 2,
    booking_id: 1002,
    booking_number: "BK-2026-8802",
    rating: 5,
    comment: "Fast emergency plumbing response. Fixed our main line pressure leak in less than 2 hours. Very clean and professional work.",
    service_name: "Water Line Leak Repair",
    provider_name: "Premier Plumbing & Drainage",
    provider: { id: 202, name: "Premier Plumbing & Drainage", business_name: "Premier Plumbing & Drainage" },
    customer_name: "Alonzo Raynor",
    customer: { id: 102, full_name: "Alonzo Raynor" },
    created_at: "2026-09-14T11:00:00Z",
  },
  {
    id: 3,
    booking_id: 1001,
    booking_number: "BK-2026-8801",
    rating: 4,
    comment: "Thorough deep office cleaning. The team sanitized all workstations and carpet areas.",
    service_name: "Deep Office Cleaning",
    provider_name: "BrightHome Cleaning Co.",
    provider: { id: 203, name: "BrightHome Cleaning Co.", business_name: "BrightHome Cleaning Co." },
    customer_name: "Sarah Whitfield",
    customer: { id: 101, full_name: "Sarah Whitfield" },
    created_at: "2026-09-10T09:15:00Z",
  },
];

export const addRatingApi = (data: {
  booking_id: number;
  rating: number;
  comment?: string;
}) => {
  const newR = {
    id: Date.now(),
    booking_id: data.booking_id,
    rating: data.rating,
    comment: data.comment || "",
    created_at: new Date().toISOString(),
  };
  return Promise.resolve({ data: { status: "success", data: newR } });
};

export const getAllRatingsApi = (_data: any) => {
  return Promise.resolve({
    data: {
      status: "success",
      data: FALLBACK_SEED_REVIEWS,
      ratings: FALLBACK_SEED_REVIEWS,
    },
  });
};

export const getAverageRatingApi = (_provider_id: number) => {
  return Promise.resolve({ data: { average: 4.9, count: 28 } });
};

export const updateRatingApi = (id: number, data: any) => {
  return Promise.resolve({ data: { status: "success", data: { id, ...data } } });
};

export const deleteRatingApi = (_id: number) => {
  return Promise.resolve({ data: { status: "success" } });
};

export const ratingApi = {
  add: (payload: CreateRatingPayload | FormData) => {
    let rData: any = { id: Date.now(), rating: 5, created_at: new Date().toISOString() };
    if (payload && !(payload instanceof FormData)) {
      rData = { ...rData, ...payload };
    }
    return Promise.resolve({ status: "success", data: rData } as ApiSuccess);
  },

  list: (_params?: ApiListParams) =>
    Promise.resolve({
      status: "success",
      data: FALLBACK_SEED_REVIEWS,
      reviews: FALLBACK_SEED_REVIEWS,
    } as unknown as ApiSuccess),

  listByBooking: (bookingId: number | string) => {
    const rev = FALLBACK_SEED_REVIEWS.find((r) => String(r.booking_id) === String(bookingId)) || FALLBACK_SEED_REVIEWS[0];
    return Promise.resolve({ status: "success", data: rev } as ApiSuccess);
  },

  listByProvider: (_providerId: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_REVIEWS } as ApiSuccess),

  provider: (_providerId: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_REVIEWS } as ApiSuccess),

  adminList: (_params?: any) =>
    Promise.resolve({
      status: "success",
      data: FALLBACK_SEED_REVIEWS,
      reviews: FALLBACK_SEED_REVIEWS,
    } as unknown as ApiSuccess),

  moderate: (id: number | string, _payload: { action: string; note?: string }) =>
    Promise.resolve({ status: "success", data: { id } } as ApiSuccess),
};

export default {
  addRatingApi,
  getAllRatingsApi,
  getAverageRatingApi,
  updateRatingApi,
  deleteRatingApi,
  ratingApi,
};

