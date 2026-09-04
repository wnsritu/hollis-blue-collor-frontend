import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  MailCheck,
  ShieldCheck,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { OtpInput } from "@/components/ui/otp-input";
import { authApi } from "@/api/modules/auth.api";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/api/errors";

type Step = "email" | "otp" | "reset" | "done";
type AccountRole = "customer" | "provider" | "admin";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole: AccountRole =
    roleParam === "provider" || roleParam === "admin" ? roleParam : "customer";

  const [step, setStep] = useState<Step>("email");
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

  const roles = [
    { id: "customer" as const, label: "Customer", icon: User },
    { id: "provider" as const, label: "Professional", icon: Building2 },
    { id: "admin" as const, label: "Admin", icon: ShieldCheck },
  ];

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

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center justify-center text-center">
            <Logo
              imgClassName="h-16 sm:h-20 max-h-24 w-auto"
              className="justify-center"
            />
          </div>

          {step === "done" ? (
            <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MailCheck size={26} />
              </span>
              <h1 className="mt-4 font-heading text-2xl font-bold">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password for <strong>{email}</strong> has been reset. You
                can log in with your new password.
              </p>
              <Button
                className="mt-6 w-full"
                onClick={() =>
                  navigate(
                    `/login?email=${encodeURIComponent(email)}&role=${role}`,
                    { replace: true }
                  )
                }
              >
                Back to log in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-center text-3xl font-extrabold tracking-tight">
                {step === "email" && "Reset your password"}
                {step === "otp" && "Enter reset code"}
                {step === "reset" && "Choose a new password"}
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {step === "email" &&
                  "Enter the email on your account and we'll send a one-time reset code."}
                {step === "otp" && (
                  <>
                    We sent a 6-digit code to <strong>{email}</strong>. Enter it
                    below.
                  </>
                )}
                {step === "reset" &&
                  "Create a strong password of at least 6 characters."}
              </p>

              {step === "email" && (
                <form className="mt-6 grid gap-4" onSubmit={handleSendCode}>
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/40 p-1">
                    {roles.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                          role === r.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <r.icon size={15} />
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fpemail">Email</Label>
                    <Input
                      id="fpemail"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" size="lg" disabled={loading}>
                    {loading ? "Sending…" : "Send reset code"}
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <form className="mt-6 grid gap-4" onSubmit={handleVerifyOtp}>
                  <div className="grid gap-2">
                    <Label>Verification code</Label>
                    <OtpInput value={otp} onChange={setOtp} length={6} />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" size="lg" disabled={loading}>
                    {loading ? "Verifying…" : "Verify code"}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {resending ? "Resending…" : "Resend code"}
                  </button>
                </form>
              )}

              {step === "reset" && (
                <form
                  className="mt-6 grid gap-4"
                  onSubmit={handleResetPassword}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNew ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" size="lg" disabled={loading}>
                    {loading ? "Updating…" : "Reset password"}
                  </Button>
                </form>
              )}

              <Link
                to={`/login?role=${role}`}
                className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft size={15} /> Back to log in
              </Link>
            </>
          )}
        </div>
      </div>
      <AuthAside />
    </div>
  );
}
