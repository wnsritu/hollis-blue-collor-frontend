import { getAdminDashboardApi, uploadProfilePhotoApi } from "@/api/admin.api";

export const getAdminDashboard = async () => {
  const res = await getAdminDashboardApi();
  return res.data;
};

export const uploadProfilePhotoService = async (file: File) => {
  try {
    const res = await uploadProfilePhotoApi(file);
    return res;
  } catch (error: any) {
    console.log("SERVICE ERROR:", error?.response || error);
    throw error;
  }
};