import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { OtpInput } from "@/components/ui/otp-input";
import { authApi } from "@/api/modules/auth.api";
import { ROLES } from "@/constants/roles";
import toast from "react-hot-toast";

function roleIdFromQuery(role?: string | null): number | undefined {
  if (role === "provider") return ROLES.PROVIDER;
  if (role === "customer") return ROLES.CUSTOMER;
  if (role === "admin") return ROLES.ADMIN;
  if (role === "support") return ROLES.SUPPORT;
  const n = Number(role);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const roleParam = searchParams.get("role");
  const roleId = useMemo(() => roleIdFromQuery(roleParam), [roleParam]);
  const isProvider = roleId === ROLES.PROVIDER || roleParam === "provider";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setError("Missing email. Go back and try again.");
      return;
    }
    if (otp.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authApi.verifyEmailOtp({
        email,
        otp: otp.trim(),
        ...(roleId != null ? { role_id: roleId } : {}),
      });

      toast.success(
        isProvider
          ? "Email verified. Your application is pending admin review — please log in."
          : "Email verified. Please log in to continue."
      );

      if (isProvider) {
        navigate(
          `/provider/onboarding?submitted=true&email=${encodeURIComponent(email)}`,
          { replace: true }
        );
      } else {
        navigate(`/login?role=customer&email=${encodeURIComponent(email)}`, {
          replace: true,
        });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Invalid or expired OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }
    try {
      setResending(true);
      await authApi.sendEmailOtp({
        email,
        ...(roleId != null ? { role_id: roleId } : {}),
      });
      toast.success(`A new code was sent to ${email}`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to resend OTP"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            to={isProvider ? "/login?role=provider" : "/login"}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} /> Back to Log in
          </Link>

          <Logo imgClassName="h-14 w-auto" />

          <div className="mt-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <KeyRound size={22} />
            </span>
            <h1 className="mt-4 text-3xl font-extrabold">Verify your email</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We sent a 6-digit verification code to{" "}
              <span className="font-semibold text-foreground">
                {email || "your email"}
              </span>
              . Enter the code below to activate your account.
            </p>
          </div>

          {!email && (
            <p className="mt-4 text-sm font-medium text-destructive">
              No email in the link. Use Log in — if your email is unverified you will be
              sent here automatically.
            </p>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div className="space-y-3">
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (error) setError("");
                }}
              />
              {error && (
                <p className="text-center text-sm font-medium text-destructive">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading || otp.length < 6 || !email}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  Verify & Continue <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
            <p>
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending || !email}
                className="font-semibold text-primary hover:underline focus:outline-none disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </p>
          </div>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}
