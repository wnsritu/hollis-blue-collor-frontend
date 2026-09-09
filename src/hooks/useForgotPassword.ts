import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { authApi } from "@/services/auth";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/api/errors";
import type { ForgotPasswordStep, AccountRole } from "@/types/auth.types";

export function useForgotPassword() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole: AccountRole =
    roleParam === "provider" || roleParam === "admin" ? roleParam : "customer";

  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [role, setRole] = useState<AccountRole>(defaultRole);
  const [email, setEmail] = useState(
    (searchParams.get("email") || "").trim().toLowerCase()
  );
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const roleId = useMemo(() => {
    if (role === "provider") return ROLES.PROVIDER;
    if (role === "admin") return ROLES.ADMIN;
    return ROLES.CUSTOMER;
  }, [role]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword({ email: normalized, role_id: roleId });
      setEmail(normalized);
      toast.success("Reset code sent to your email.");
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reset code."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (otp.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    try {
      setLoading(true);
      await authApi.verifyForgotOtp({
        email: email.trim().toLowerCase(),
        otp,
        role_id: roleId,
      });
      toast.success("Code verified. Set your new password.");
      setStep("reset");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        role_id: roleId,
        otp,
        new_password: newPassword,
      });
      toast.success("Password reset successfully.");
      setStep("done");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset password."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      setResending(true);
      await authApi.forgotPassword({
        email: email.trim().toLowerCase(),
        role_id: roleId,
      });
      toast.success("A new code was sent.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resend code."));
    } finally {
      setResending(false);
    }
  };

  return {
    step,
    setStep,
    role,
    setRole,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    error,
    setError,
    loading,
    resending,
    handleSendCode,
    handleVerifyOtp,
    handleResetPassword,
    handleResend,
  };
}
