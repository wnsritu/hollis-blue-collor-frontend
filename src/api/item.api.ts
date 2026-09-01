import api from "./axios";

// 🔥 GET ITEMS
export const getItemsAPI = async (payload: {
  page: number;
  limit: number;
  search: string;
  category_id?: number;
}) => {
  const res = await api.post("/items/list", payload);
  return res.data;
};

// 🔥 GET SERVICE
export const getServicesAPI = async (payload: {
  page: number;
  limit: number;
  search: string;
  category_id?: number;
}) => {
  const res = await api.post("/services/list", payload);
  return res.data;
};

// 🔥 SERVICES (static for now)
// export const getServicesAPI = async () => {
//   return ["wash", "fold", "iron", "hang"];
// };

// 🔥 GET CLEANING CONFIG
export const getCleaningConfigAPI = async () => {
  const res = await api.get("/services/cleaning-config");
  return res.data;
};
