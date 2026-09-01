import api from "./axios";

export const loginApi = (data: {
  email: string;
  password: string;
  role: string;
}) => {
  return api.post("/auth/login", data);
};

export const signupApi = (data: any) => {
  return api.post("/auth/register", data);
};

// ✅ NEW GOOGLE LOGIN API
export const googleLoginApi = (data: { token: string }) => {
  return api.post("/auth/google-login", data);
};

// ✅ Forgot Password
export const forgotPasswordApi = (payload: { email: string, role_id?: number }) => {
  return api.post("/forgot-password", payload);
};

// ✅ Verify OTP
export const verifyOtpApi = (payload: { email: string; otp: string; role_id?: number }) => {
  return api.post("/verify-otp", payload);
};

// ✅ Reset Password
export const resetPasswordApi = (payload: {
  email: string;
  newPassword: string;
  role_id?: number;
}) => {
  return api.post("/reset-password", payload);
};

// ✅ Resend OTP API
export const resendOtpApi = (payload: { email: string, role_id?: number }) => {
  return api.post("/resend-otp", payload);
};

export const changePasswordApi = (payload: {
  old_password: string;
  new_password: string;
}) => {
  return api.put("/auth/change-password", payload);
};


// ✅ ADD THIS - Phone OTP Login API
export const loginWithOTPApi = (payload: { token: string }) => {
  return api.post("/auth/login-with-otp", payload);
};

// ✅ EMAIL OTP
export const sendEmailOtpApi = (payload: { email: string, role_id?: number }) => {
  return api.post("/auth/send-email-otp", payload);
};

export const verifyEmailOtpApi = (payload: {
  email: string;
  otp: string;
  role_id?: number;
}) => {
  return api.post("/auth/verify-email-otp", payload);
};

// ✅ PHONE OTP
export const sendPhoneOtpApi = (payload: { phone: string }) => {
  return api.post("/auth/send-phone-otp", payload);
};

export const verifyPhoneOtpApi = (payload: {
  phone: string;
  idToken: string;
  role_id?: number;
}) => {
  return api.post("/auth/verify-phone-otp", payload);
};