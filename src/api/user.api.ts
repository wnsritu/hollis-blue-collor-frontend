import api from "./axios";

export const getMyProfileApi = () => {
  return api.get("/user/my-profile");
};

export const updateMyProfileApi = (data) => {
  return api.put("/user/customer/profile", data);
};