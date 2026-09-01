import {
  changePasswordApi,
  forgotPasswordApi,
  googleLoginApi,
  loginApi,
  loginWithOTPApi,
  resendOtpApi,
  resetPasswordApi,
  sendEmailOtpApi,
  sendPhoneOtpApi,
  signupApi,
  verifyEmailOtpApi,
  verifyOtpApi,
  verifyPhoneOtpApi,
} from "@/api/auth.api";

export const loginUser = async (payload: any) => {
  const res = await loginApi(payload);
  return res.data;
};

export const signupUser = async (payload: any) => {
  const res = await signupApi(payload);
  return res.data;
};

// ✅ GOOGLE LOGIN SERVICE (FIXED)
export const googleLoginUser = async (payload: {
  token: string;
  role: number;
}) => {
  const res = await googleLoginApi(payload);
  return res.data;
};

// ✅ Forgot Password
export const forgotPassword = async (email: string, role_id: number) => {
  const res = await forgotPasswordApi({ email, role_id });
  return res.data;
};

// ✅ Verify OTP
export const verifyOtp = async (payload: {
  email: string;
  otp: string;
  role_id?: number;
}) => {
  const res = await verifyOtpApi(payload);
  return res.data;
};

// ✅ Reset Password
export const resetPassword = async (payload: {
  email: string;
  newPassword: string;
  role_id?: number;
}) => {
  const res = await resetPasswordApi(payload);
  return res.data;
};

// ✅ Resend OTP Service
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
    role_id: 3 | 4; // ✅ Explicit type
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
  const res = await sendPhoneOtpApi(data); // ✅ pass full object
  return res.data;
};

export const verifyPhoneOtp = async (payload: any) => {
  const res = await verifyPhoneOtpApi(payload);
  return res.data;
};