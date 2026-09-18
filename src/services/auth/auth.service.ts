import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import { AUTH_ENDPOINTS, FORGOT_PASSWORD_LEGACY_ENDPOINTS } from "@/apiEndPoints/auth";

export const loginApi = (data: {
  email: string;
  password: string;
  role: string;
}) => {
  return apiClient.post(AUTH_ENDPOINTS.login, data);
};

export const signupApi = (data: any) => {
  return apiClient.post(AUTH_ENDPOINTS.register, data);
};

export const googleLoginApi = (data: { token: string }) => {
  return apiClient.post(AUTH_ENDPOINTS.googleLogin, data);
};

export const forgotPasswordApi = (payload: { email: string; role_id?: number }) => {
  return apiClient.post(FORGOT_PASSWORD_LEGACY_ENDPOINTS.request, payload);
};

export const verifyOtpApi = (payload: { email: string; otp: string; role_id?: number }) => {
  return apiClient.post(FORGOT_PASSWORD_LEGACY_ENDPOINTS.verifyOtp, payload);
};

export const resetPasswordApi = (payload: {
  email: string;
  newPassword: string;
  role_id?: number;
}) => {
  return apiClient.post(FORGOT_PASSWORD_LEGACY_ENDPOINTS.resetPassword, payload);
};

export const resendOtpApi = (payload: { email: string; role_id?: number }) => {
  return apiClient.post("/resend-otp", payload);
};

export const changePasswordApi = (payload: {
  old_password: string;
  new_password: string;
}) => {
  return apiClient.put(AUTH_ENDPOINTS.changePassword, payload);
};

export const loginWithOTPApi = (payload: { token: string }) => {
  return apiClient.post(AUTH_ENDPOINTS.loginWithOtp, payload);
};

export const sendEmailOtpApi = (payload: { email: string; role_id?: number }) => {
  return apiClient.post(AUTH_ENDPOINTS.sendEmailOtp, payload);
};

export const verifyEmailOtpApi = (payload: {
  email: string;
  otp: string;
  role_id?: number;
}) => {
  return apiClient.post(AUTH_ENDPOINTS.verifyEmailOtp, payload);
};

export const sendPhoneOtpApi = (payload: { phone: string; role_id?: number }) => {
  return apiClient.post("/auth/send-phone-otp", payload);
};

export const verifyPhoneOtpApi = (payload: {
  phone: string;
  idToken: string;
  role_id?: number;
}) => {
  return apiClient.post(AUTH_ENDPOINTS.verifyPhoneOtp, payload);
};

// --- High-level service methods (return res.data) ---

export const loginUser = async (payload: any) => {
  const res = await loginApi(payload);
  return res.data;
};

export const signupUser = async (payload: any) => {
  const res = await signupApi(payload);
  return res.data;
};

export const googleLoginUser = async (payload: {
  token: string;
  role: number;
}) => {
  const res = await googleLoginApi(payload);
  return res.data;
};

export const forgotPassword = async (email: string, role_id: number) => {
  const res = await forgotPasswordApi({ email, role_id });
  return res.data;
};

export const verifyOtp = async (payload: {
  email: string;
  otp: string;
  role_id?: number;
}) => {
  const res = await verifyOtpApi(payload);
  return res.data;
};

export const resetPassword = async (payload: {
  email: string;
  newPassword: string;
  role_id?: number;
}) => {
  const res = await resetPasswordApi(payload);
  return res.data;
};

export const resendOtp = async (email: string, role_id?: number) => {
  const res = await resendOtpApi({ email, role_id });
  return res.data;
};

export const changePasswordService = async (payload: {
  old_password: string;
  new_password: string;
}) => {
  const res = await changePasswordApi(payload);
  return res.data;
};

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    role_id: 3 | 4;
    email?: string;
    phone?: string;
  };
}

export const loginWithOTP = async (
  firebaseToken: string,
): Promise<LoginResponse> => {
  const res = await loginWithOTPApi({ token: firebaseToken });
  return res.data;
};

export const sendEmailOtp = async (data: {
  email: string;
  role_id: number;
}) => {
  const res = await sendEmailOtpApi(data);
  return res.data;
};

export const verifyEmailOtp = async (payload: any) => {
  const res = await verifyEmailOtpApi(payload);
  return res.data;
};

export const sendPhoneOtp = async (data: {
  phone: string;
  role_id: number;
}) => {
  const res = await sendPhoneOtpApi(data);
  return res.data;
};

export const verifyPhoneOtp = async (payload: any) => {
  const res = await verifyPhoneOtpApi(payload);
  return res.data;
};

export const authApi = {
  login: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.login, payload),

  register: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.register, payload),

  checkEmail: (email: string, phone?: string) =>
    http.post<any>(ENDPOINTS.auth.checkEmail, {
      email,
      phone,
    }),

  logout: () => http.post<any>(ENDPOINTS.auth.logout),

  refreshToken: (refreshToken: string) =>
    http.post<any>(ENDPOINTS.auth.refreshToken, { refreshToken }),

  me: () => http.get<any>(ENDPOINTS.auth.me),

  changePassword: (payload: any) =>
    http.put<any>(ENDPOINTS.auth.changePassword, payload),

  googleLogin: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.googleLogin, payload),

  loginWithOtp: (payload: { email: string; otp: string; role_id?: number }) =>
    http.post<any>(ENDPOINTS.auth.loginWithOtp, payload),

  sendEmailOtp: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.sendEmailOtp, payload),

  verifyEmailOtp: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.verifyEmailOtp, payload),

  verifyEmail: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.verifyEmail, payload),

  resendVerification: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.resendVerification, payload),

  verifyPhoneOtp: (payload: {
    phone: string;
    idToken: string;
    role_id?: number;
  }) => http.post<any>(ENDPOINTS.auth.verifyPhoneOtp, payload),

  forgotPassword: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.forgotPassword, payload),

  verifyForgotOtp: (payload: { email: string; otp: string; role_id?: number }) =>
    http.post<any>(FORGOT_PASSWORD_LEGACY_ENDPOINTS.verifyOtp, payload),

  verifyOtp: (payload: { email: string; otp: string; role_id?: number }) =>
    http.post<any>(FORGOT_PASSWORD_LEGACY_ENDPOINTS.verifyOtp, payload),

  resetPassword: (payload: any) =>
    http.post<any>(ENDPOINTS.auth.resetPassword, payload),
};

