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
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { useTranslation } from "@/hooks/useTranslation";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
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
  } = useForgotPassword();

  const roles = [
    { id: "customer" as const, label: "Customer", icon: User },
    { id: "provider" as const, label: "Professional", icon: Building2 },
    { id: "admin" as const, label: "Admin", icon: ShieldCheck },
  ];


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
                {t("passwordUpdated", "Password updated")}
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
                {t("backToLogin", "Back to log in")}
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-center text-3xl font-extrabold tracking-tight">
                {step === "email" && t("resetYourPassword", "Reset your password")}
                {step === "otp" && t("enterResetCode", "Enter reset code")}
                {step === "reset" && t("chooseNewPassword", "Choose a new password")}
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
                  {role !== "provider" && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                      }}
                      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft size={15} /> Change email
                    </button>
                  )}
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
