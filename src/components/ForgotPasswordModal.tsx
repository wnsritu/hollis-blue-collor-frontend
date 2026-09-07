import React, { useState } from "react";
import { Eye, EyeOff, X, KeyRound, Clock, AlertCircle } from "lucide-react";
import { forgotPassword, verifyOtp, resetPassword, resendOtp } from "@/services/auth.service";
import useCountdown from "@/hooks/useCountdown";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";

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
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { isExpired, reset, formatTime } = useCountdown(600);

  if (!open) return null;

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    onClose();
  };

  const handleResendOtp = async () => {
    try {
      setErrors({});
      await toast.promise(resendOtp(email, roleId), {
        loading: "Resending OTP...",
        success: "OTP resent successfully.",
        error: (err: any) => err?.response?.data?.message || "Failed to resend OTP",
      });
      reset();
    } catch (err: any) {
      console.log(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-pop relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        {/* STEP 1: EMAIL */}
        {step === "email" && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <KeyRound size={22} />
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">
                Forgot Password
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Enter your email address associated with your account
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!email) {
                  setErrors({ email: "Email is required" });
                  return;
                }

                try {
                  setLoading(true);
                  setErrors({});
                  await toast.promise(forgotPassword(email, roleId), {
                    loading: "Sending OTP...",
                    success: "OTP sent successfully.",
                    error: (err: any) => err?.response?.data?.message || "Failed to send OTP",
                  });
                  reset();
                  setStep("otp");
                } catch (err: any) {
                  setErrors({ email: err?.response?.data?.message || "Failed to send OTP" });
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev: any) => ({ ...prev, email: "" }));
                  }}
                />
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Get OTP Code"}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: OTP */}
        {step === "otp" && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <KeyRound size={22} />
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">
                Verify Code
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!otp || otp.length !== 6) {
                  setErrors({ otp: "Please enter all 6 digits of OTP" });
                  return;
                }

                try {
                  setLoading(true);
                  setErrors({});
                  await toast.promise(verifyOtp({ email, otp, role_id: roleId }), {
                    loading: "Verifying OTP...",
                    success: "OTP verified successfully.",
                    error: (err: any) => err?.response?.data?.message || "Invalid OTP",
                  });
                  setStep("reset");
                } catch (err: any) {
                  setErrors({ otp: err?.response?.data?.message || "Invalid OTP" });
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (errors.otp) setErrors({});
                }}
              />

              <div className="flex justify-center text-xs font-medium">
                {isExpired ? (
                  <span className="inline-flex items-center gap-1.5 text-destructive bg-destructive-soft px-3 py-1 rounded-full">
                    <AlertCircle size={13} /> OTP Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-primary bg-primary-soft px-3 py-1 rounded-full">
                    <Clock size={13} /> Expires in <span className="font-bold">{formatTime()}</span>
                  </span>
                )}
              </div>

              {errors.otp && <p className="text-center text-xs font-semibold text-destructive">{errors.otp}</p>}

              <p className="text-center text-xs text-muted-foreground">
                Didn’t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="font-semibold text-primary hover:underline focus:outline-none"
                >
                  Resend Code
                </button>
              </p>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || otp.length < 6}
              >
                {loading ? "Verifying..." : "Verify & Proceed"}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === "reset" && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <KeyRound size={22} />
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">
                Create New Password
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Your new password must be at least 6 characters
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                let newErrors: any = {};
                if (!newPassword || newPassword.length < 6) {
                  newErrors.newPassword = "Minimum 6 characters required";
                }
                if (newPassword !== confirmPassword) {
                  newErrors.confirmPassword = "Passwords do not match";
                }

                if (Object.keys(newErrors).length) {
                  setErrors(newErrors);
                  return;
                }

                try {
                  setLoading(true);
                  setErrors({});
                  await toast.promise(resetPassword({ email, newPassword, role_id: roleId }), {
                    loading: "Resetting password...",
                    success: "Password reset successfully.",
                    error: (err: any) => err?.response?.data?.message || "Reset failed",
                  });
                  handleClose();
                  onSuccess();
                } catch (err: any) {
                  setErrors({ newPassword: err?.response?.data?.message || "Reset failed" });
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-xs font-bold uppercase tracking-wider">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-pass"
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((prev: any) => ({ ...prev, newPassword: "" }));
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-destructive font-medium">{errors.newPassword}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pass" className="text-xs font-bold uppercase tracking-wider">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pass"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev: any) => ({ ...prev, confirmPassword: "" }));
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
