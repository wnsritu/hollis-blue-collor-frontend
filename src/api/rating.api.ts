import api from "./axios";

export const addRatingApi = (data: {
  booking_id: number;
  rating: number;
  comment?: string;
}) => {
  return api.post("/ratings/ratings", data);
};

export const getAllRatingsApi = (data: {
  provider_id?: number;
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  return api.post("/ratings/all", data);
};

export const getAverageRatingApi = (provider_id: number) => {
  return api.get(`/ratings/ratings/${provider_id}/avg`);
};

export const updateRatingApi = (id: number, data: any) => {
  return api.put(`/ratings/ratings/${id}`, data);
};

export const deleteRatingApi = (id: number) => {
  return api.delete(`/ratings/ratings/${id}`);
};
