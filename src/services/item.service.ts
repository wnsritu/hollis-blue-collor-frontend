import { getItemsAPI, getServicesAPI, getCleaningConfigAPI } from "@/api/item.api";

export const getItems = async (payload?: any) => {
  try {
    const res = await getItemsAPI({
      page: 1,
      limit: 50, 
      search: "",
      ...payload
    });

    return res;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const getServices = async (payload?: any) => {
  try {
    const res = await getServicesAPI({
      page: 1,
      limit: 50, 
      search: "",
      ...payload
    });
    return res;
  } catch (err: any) {
    throw err;
  }
};

export const getCleaningConfig = async () => {
  try {
    const res = await getCleaningConfigAPI();
    return res.data;
  } catch (err: any) {
    throw err;
  }
};
