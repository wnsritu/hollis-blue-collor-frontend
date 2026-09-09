export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultRole: "customer" | "provider";
  onLogin: (roleId: number) => void;
  onOpenForgot?: (roleId: number) => void;
}

export interface VerifyOtpModalProps {
  open: boolean;
  type: "email" | "mobile";
  target: string;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => void;
}

export interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleId: number;
}

export interface OtpLoginProps {
  onSuccess: (role_id: 3 | 4) => void;
  onBack: () => void;
}

export type LoginRole = "customer" | "provider" | "admin";
export type AccountRole = "customer" | "provider" | "admin";
export type ForgotPasswordStep = "email" | "otp" | "reset" | "done";
export type OtpLoginStep = "phone" | "otp";

export interface ProviderSignupDraft {
  name: string;
  businessName?: string;
  email: string;
  mobile?: string;
  phone?: string;
  password?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  service_location_address?: string;
  category_id?: string;
  subcategory_ids?: string[];
}
