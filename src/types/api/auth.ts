import type { RoleId, RoleName } from "@/constants/roles";

export type AuthUser = {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id: RoleId | number;
  role?: RoleName | string;
  status?: string;
  profile_photo?: string | null;
  [key: string]: unknown;
};

export type LoginPayload = {
  email: string;
  password: string;
  role?: string;
  role_id?: number;
};

export type RegisterPayload = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  role_id?: number;
  [key: string]: unknown;
};

export type AuthTokens = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
};

export type AuthResponse = AuthTokens & {
  user?: AuthUser;
  data?: AuthUser & AuthTokens;
  message?: string;
};

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export type ForgotPasswordPayload = {
  email: string;
  role_id?: number;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
  role_id?: number;
};

export type ResetPasswordPayload = {
  email: string;
  newPassword?: string;
  new_password?: string;
  otp?: string;
  role_id?: number;
};

export type GoogleLoginPayload = {
  token: string;
  role?: string;
  role_id?: number;
};

export type SaveFcmTokenPayload = {
  fcm_token: string;
};
