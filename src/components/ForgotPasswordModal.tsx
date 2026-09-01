"use client";

import React, { useState } from "react";
import { Eye, EyeOff, X, AlertCircle,Clock } from "lucide-react";

import {
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
} from "@/services/auth.service";
import useCountdown from "@/hooks/useCountdown";
import { toast } from "react-hot-toast";


const ForgotPasswordModal = ({
  open,
  onClose,
  onSuccess,
  roleId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleId: number;
}) => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { time, isExpired, reset, formatTime } = useCountdown(600);

  if (!open) return null;

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setErrors("");
    onClose();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // 👉 Move forward
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  // ✅ NEW FUNCTION (IMPORTANT)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // 👉 just clear current box
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // 👉 move to previous box
        const prev = document.getElementById(`otp-${index - 1}`);
        prev?.focus();

        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleResendOtp = async () => {
    try {
      // setLoading(true);
      setErrors({});

      await toast.promise(resendOtp(email, roleId), {
        loading: "Resending OTP...",
        success: "OTP resent successfully.",
        error: (err: any) =>
          err?.response?.data?.message || "Failed to resend OTP",
      });
      reset();

      // setErrors({ otpSuccess: "OTP resent successfully" });
    } catch (err: any) {
      // setErrors({
      //   otp: err?.response?.data?.message || "Failed to resend OTP",
      // });
    } finally {
      setLoading(false);
    }
  };

  const otpValue = otp.join("");

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-foreground/40 ">
      <div className="w-full max-w-[460px] bg-white rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] relative">
        {" "}
        {/* CLOSE */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-black"
        >
          <X size={22} />
        </button>
        {/* ================= EMAIL ================= */}
        {step === "email" && (
          <>
            <h2 className="text-[28px] font-bold text-center text-gray-700">
              Forgot Password
            </h2>

            <p className="text-center text-gray-500 text-[14px] mt-2 mb-6 leading-5">
              Enter your Email Address associated with your account
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                let newErrors: any = {};

                if (!email) {
                  newErrors.email = "Email is required";
                }

                if (Object.keys(newErrors).length) {
                  setErrors(newErrors);
                  return;
                }

                try {
                  // setLoading(true);
                  setErrors({});
                  await toast.promise(forgotPassword(email, roleId), {
                    loading: "Sending OTP...",
                    success: "OTP sent successfully.",
                    error: (err: any) =>
                      err?.response?.data?.message || "Failed to send OTP",
                  });
                  reset();
                  setStep("otp");
                } catch (err: any) {
                  setErrors({
                    email: err?.response?.data?.message || "Failed to send OTP",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[14px] font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className="w-full h-[44px] px-4 border border-gray-300 rounded-xl text-[14px] focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              <button
                className="w-full h-[40px] rounded-xl text-white font-normal text-[15px] 
bg-gradient-to-r from-blue-500 to-blue-500 hover:opacity-95 transition"
                disabled={loading}
              >
                {loading ? "Sending..." : "Get OTP"}
              </button>
            </form>

            {/* <p className="text-center text-gray-500 text-[14px] mt-2 mb-7 leading-[20px]">
              Don’t have an account?{" "}
              <span className="text-blue-600 cursor-pointer font-medium">
                Sign Up
              </span>
            </p> */}
          </>
        )}
        {/* ================= OTP ================= */}
        {step === "otp" && (
          <>
            <h2 className="text-[26px] font-semibold text-center text-gray-800">
              Verify Code
            </h2>

            <p className="text-center text-gray-500 text-[14px] mt-2 mb-6">
              Enter the OTP (One Time Password) sent on{" "}
              <span className="font-medium">{email}</span>
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                let newErrors: any = {};

                if (!otpValue || otpValue.length !== 6) {
                  newErrors.otp = "OTP is required";
                  setErrors(newErrors);
                  return;
                }

                try {
                  // setLoading(true);
                  setErrors({});
                  await toast.promise(verifyOtp({ email, otp: otpValue, role_id:roleId }), {
                    loading: "Verifying OTP...",
                    success: "OTP verified successfully.",
                    error: (err: any) =>
                      err?.response?.data?.message || "Invalid OTP",
                  });
                  setStep("reset");
                } catch (err: any) {
                  setErrors({
                    otp: err?.response?.data?.message || "Invalid OTP",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-6"
            >
              {/* OTP BOXES */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)} // ✅ ADD THIS
                    className="
                    w-[36px] h-[38px]
                    text-center
                    border border-gray-300
                    rounded-lg
                    text-[15px] font-medium
                    text-gray-700
                    focus:border-blue-500
                    focus:ring-1 focus:ring-blue-200
                    outline-none
                  "
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="text-red-500 text-xs text-center">{errors.otp}</p>
              )}
              {errors.otpSuccess && (
                <p className="text-green-600 text-xs text-center">
                  {errors.otpSuccess}
                </p>
              )}

              <p className="text-center text-sm mt-2">
                {isExpired ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 font-medium">
                    <AlertCircle size={14} />
                    OTP Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    <Clock size={14} />
                    Expires in
                    <span className="font-semibold tracking-wide">
                      {formatTime()}
                    </span>
                  </span>
                )}
              </p>
              <p className="text-center text-sm text-gray-500">
                Don’t receive the OTP ?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-600 cursor-pointer font-medium hover:underline disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Resend"}
                </button>
              </p>

              <button
                className="w-full h-[40px] bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-normal text-[15px]"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Proceed"}
              </button>
            </form>
          </>
        )}
        {/* ================= RESET ================= */}
        {step === "reset" && (
          <>
            <h2 className="text-[26px] font-bold text-center text-gray-700">
              Create New Password
            </h2>

            <p className="text-center text-gray-500 text-[14px] mt-2 mb-6">
              Your new password must be different from your previous password
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                let newErrors: any = {};

                if (!newPassword) {
                  newErrors.newPassword = "Password is required";
                }

                if (!confirmPassword) {
                  newErrors.confirmPassword = "Confirm password is required";
                }

                if (newPassword !== confirmPassword) {
                  newErrors.confirmPassword = "Passwords do not match";
                }

                if (Object.keys(newErrors).length) {
                  setErrors(newErrors);
                  return;
                }

                try {
                  // setLoading(true);
                  setErrors("");
                  await toast.promise(resetPassword({ email, newPassword, role_id: roleId }), {
                    loading: "Resetting password...",
                    success: "Password reset successfully.",
                    error: (err: any) =>
                      err?.response?.data?.message || "Reset failed",
                  });
                  handleClose();
                  onSuccess();
                } catch (err: any) {
                  setErrors(err?.response?.data?.message || "Reset failed");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              {/* PASSWORD */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>

                <input
                  type={showNew ? "text" : "password"} // ✅ FIX
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((prev: any) => ({ ...prev, newPassword: "" })); // ✅ error remove
                  }}
                  className="w-full h-[44px] px-4 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {/* 👁️ Eye */}
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-black"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {errors.newPassword && (
                  <p className="text-red-500 text-xs">{errors.newPassword}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>

                <input
                  type={showConfirm ? "text" : "password"} // ✅ FIX
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prev: any) => ({
                      ...prev,
                      confirmPassword: "",
                    })); // ✅ error remove
                  }}
                  className="w-full h-[44px] px-4 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {/* 👁️ Eye */}
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-black"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                className="w-full h-[40px] bg-blue-500 hover:bg-blue-500 text-white rounded-lg font-normal text-[15px]"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
