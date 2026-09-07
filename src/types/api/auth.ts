import type { RoleId, RoleName } from "@/constants/roles";

export type AuthUser = {
  id: number;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id: RoleId | number;
  role?: RoleName | string;
  status?: string;
  email_verified?: boolean | number;
  is_profile_setup?: boolean | number;
  /** Backend string enum from getProviderOnboardingStatus */
  onboarding_status?: string;
  profile_photo?: string | null;
  [key: string]: unknown;
};

export type LoginPayload = {
  email: string;
  password: string;
  /** Some legacy login UIs sent this; password login ignores it */
  role?: number | string;
};

/**
 * Register body — backend Joi allows `role` only (role id: 1–4).
 * Do NOT send `role_id` on `/auth/register` or validation fails with "role_id is not allowed".
 */
export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  /** Role id — same values as `ROLES` / backend `role` field */
  role: number;
  business_name?: string;
  category_id?: number;
  service_type_ids?: number[] | string;
  service_location_address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  license_number?: string;
  insurance_policy?: string;
  license_document?: string;
  insurance_certificate?: string;
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
