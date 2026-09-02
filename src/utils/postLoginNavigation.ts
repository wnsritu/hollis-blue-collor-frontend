/**
 * Shared post-auth navigation for providers.
 * Backend `onboarding_status` is a string enum (not `{ is_complete }`).
 */
import { ROLES } from "@/constants/roles";

export const PROVIDER_ONBOARDING_STATUS = {
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  EMAIL_VERIFIED_WAITING_FOR_ADMIN_APPROVAL:
    "EMAIL_VERIFIED_WAITING_FOR_ADMIN_APPROVAL",
  ADMIN_APPROVED_PROFILE_INCOMPLETE: "ADMIN_APPROVED_PROFILE_INCOMPLETE",
  PROFILE_COMPLETED: "PROFILE_COMPLETED",
} as const;

export type ProviderOnboardingStatus =
  (typeof PROVIDER_ONBOARDING_STATUS)[keyof typeof PROVIDER_ONBOARDING_STATUS];

type NavUser = {
  email?: string;
  role_id?: number | null;
  email_verified?: boolean | number | null;
  is_profile_setup?: boolean | number | null;
  onboarding_status?: string | { is_complete?: boolean } | null;
};

function statusOf(user: NavUser | null | undefined): string {
  const raw = user?.onboarding_status;
  if (typeof raw === "string") return raw;
  return "";
}

export function resolvePostLoginPath(user: NavUser | null | undefined): string {
  const roleId = Number(user?.role_id);

  if (roleId === ROLES.CUSTOMER) return "/dashboard";
  if (roleId === ROLES.ADMIN) return "/admin";
  if (roleId === ROLES.SUPPORT) return "/support-dashboard";

  if (roleId !== ROLES.PROVIDER) return "/";

  const status = statusOf(user);
  const email = (user?.email || "").trim().toLowerCase();
  const emailVerified =
    user?.email_verified === true || user?.email_verified === 1;
  const profileDone =
    user?.is_profile_setup === true || user?.is_profile_setup === 1;

  if (
    status === PROVIDER_ONBOARDING_STATUS.EMAIL_NOT_VERIFIED ||
    (!emailVerified && status !== PROVIDER_ONBOARDING_STATUS.PROFILE_COMPLETED)
  ) {
    return `/verify-email?email=${encodeURIComponent(email)}&role=provider`;
  }

  if (
    status === PROVIDER_ONBOARDING_STATUS.PROFILE_COMPLETED ||
    profileDone
  ) {
    return "/provider/dashboard";
  }

  if (status === PROVIDER_ONBOARDING_STATUS.ADMIN_APPROVED_PROFILE_INCOMPLETE) {
    // Complete remaining profile fields — NOT the public signup wizard
    return "/provider/profile";
  }

  // Waiting for admin approval → pending portal (submitted screen)
  return "/provider/onboarding?submitted=true";
}
