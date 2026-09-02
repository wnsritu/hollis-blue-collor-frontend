import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  GoogleLoginPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SaveFcmTokenPayload,
  VerifyOtpPayload,
} from "@/types/api/auth";

export const authApi = {
  login: (payload: LoginPayload) =>
    http.post<AuthResponse>(ENDPOINTS.auth.login, payload),

  register: (payload: RegisterPayload) =>
    http.post<AuthResponse>(ENDPOINTS.auth.register, payload),

  logout: () => http.post<ApiSuccess>(ENDPOINTS.auth.logout),

  refreshToken: (refreshToken: string) =>
    http.post<AuthResponse>(ENDPOINTS.auth.refreshToken, { refreshToken }),

  me: () => http.get<ApiSuccess<AuthUser> | AuthUser>(ENDPOINTS.auth.me),

  changePassword: (payload: ChangePasswordPayload) =>
    http.put<ApiSuccess>(ENDPOINTS.auth.changePassword, payload),

  googleLogin: (payload: GoogleLoginPayload) =>
    http.post<AuthResponse>(ENDPOINTS.auth.googleLogin, payload),

  loginWithOtp: (payload: { email: string; otp: string; role_id?: number }) =>
    http.post<AuthResponse>(ENDPOINTS.auth.loginWithOtp, payload),

  sendEmailOtp: (payload: ForgotPasswordPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.sendEmailOtp, payload),

  verifyEmailOtp: (payload: VerifyOtpPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.verifyEmailOtp, payload),

  verifyEmail: (payload: VerifyOtpPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.verifyEmail, payload),

  resendVerification: (payload: ForgotPasswordPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.resendVerification, payload),

  verifyPhoneOtp: (payload: {
    phone: string;
    idToken: string;
    role_id?: number;
  }) => http.post<AuthResponse>(ENDPOINTS.auth.verifyPhoneOtp, payload),

  /** Prefer auth-prefixed routes; legacy paths kept for older backends */
  forgotPassword: (payload: ForgotPasswordPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.forgotPassword, payload),

  verifyForgotOtp: (payload: VerifyOtpPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.forgotPasswordLegacy.verifyOtp, payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.resetPassword, payload),

  saveFcmToken: (payload: SaveFcmTokenPayload) =>
    http.post<ApiSuccess>(ENDPOINTS.auth.saveFcmToken, payload),

  removeFcmToken: () => http.post<ApiSuccess>(ENDPOINTS.auth.removeFcmToken),
};

export default authApi;
