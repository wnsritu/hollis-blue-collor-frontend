import { getMyProfileApi, updateMyProfileApi } from "@/api/user.api";

export const getMyProfile = async () => {
  const res = await getMyProfileApi();
  return res.data;
};

export const updateMyProfile = async (payload) => {
  const res = await updateMyProfileApi(payload);
  return res.data;
};