import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { sanitizePhoneInput } from "@/utils/format";
import { authApi } from "@/services/auth";
import { getErrorMessage } from "@/services";
import { getLoggedInHomeRedirect } from "@/utils/postLoginNavigation";
import { tokenStorage } from "@/utils/tokenStorage";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { isValidEmail, isValidPhone } from "@/validations";
import type { ProviderSignupDraft } from "@/types/auth.types";

export const PROVIDER_SIGNUP_DRAFT_KEY = STORAGE_KEYS.PROVIDER_SIGNUP_DRAFT;

export function useSignUpForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, register } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  useEffect(() => {
    if (isAuthenticated || hasToken) {
      navigate(getLoggedInHomeRedirect(user), { replace: true });
    }
  }, [isAuthenticated, hasToken, user, navigate]);

  const [role, setRole] = useState<"customer" | "provider">(
    searchParams.get("role") === "provider" ? "provider" : "customer"
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const updateMobile = (value: string) => {
    const val = sanitizePhoneInput(value);
    setForm((prev) => ({ ...prev, mobile: val }));
    if (fieldErrors.mobile) {
      setFieldErrors((prev) => ({ ...prev, mobile: undefined }));
    }
  };

  const selectRole = (newRole: "customer" | "provider") => {
    setRole(newRole);
    setError("");
    setFieldErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) {
      errs.name = "Full name is required.";
    } else if (form.name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters.";
    }

    if (role === "provider") {
      if (!form.businessName.trim()) {
        errs.businessName = "Business name is required for professionals.";
      } else if (form.businessName.trim().length < 2) {
        errs.businessName = "Business name must be at least 2 characters.";
      }
    }

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      errs.email = "Email address is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      errs.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    if (!form.mobile.trim()) {
      errs.mobile = "Mobile number is required.";
    } else if (!isValidPhone(form.mobile)) {
      errs.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!form.password) {
      errs.password = "Password is required.";
    } else if (form.password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!agree) {
      errs.agree = "You must agree to the Terms and Privacy Policy.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    // Provider: collect category/coverage/credentials on onboarding (service-connect flow)
    if (role === "provider") {
      try {
        setLoading(true);
        const checkRes = await authApi.checkEmail(form.email.trim().toLowerCase());
        if (checkRes && (checkRes as any).available === false) {
          const msg = "This email address is already registered. Please log in or use a different email.";
          setFieldErrors((prev) => ({ ...prev, email: msg }));
          setError(msg);
          return;
        }
      } catch (err: any) {
        if (err?.response?.status === 409 || err?.status === 409) {
          const msg = "This email address is already registered. Please log in or use a different email.";
          setFieldErrors((prev) => ({ ...prev, email: msg }));
          setError(msg);
          return;
        }
        toast.error(getErrorMessage(err, "Failed to verify email availability. Please try again."));
        return;
      } finally {
        setLoading(false);
      }

      const draft: ProviderSignupDraft = {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password.trim(),
      };

      try {
        setLoading(true);
        await authApi.checkEmail(draft.email, draft.mobile);
      } catch (err: any) {
        const msg = getErrorMessage(err, "Email is already registered.");
        setError(msg);
        if (/phone|mobile/i.test(msg)) {
          setFieldErrors((prev) => ({ ...prev, mobile: msg }));
        } else {
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        }
        return;
      } finally {
        setLoading(false);
      }

      try {
        sessionStorage.setItem(PROVIDER_SIGNUP_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* ignore */
      }
      toast.success("Account details saved — continue onboarding.");
      navigate("/provider/onboarding", {
        replace: false,
        state: draft,
      });
      return;
    }

    try {
      setLoading(true);
      await register({
        full_name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.mobile.trim(),
        password: form.password.trim(),
        role: ROLES.CUSTOMER,
      });
      toast.success("Account created. Enter the OTP sent to your email.");
      navigate(
        `/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}&role=customer`,
        { replace: true }
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    role,
    selectRole,
    form,
    updateField,
    updateMobile,
    error,
    fieldErrors,
    setFieldErrors,
    loading,
    agree,
    setAgree,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
  };
}
