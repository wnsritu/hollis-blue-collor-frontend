import { useEffect, useState } from "react";
import { X, Clock, AlertCircle, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import useCountdown from "@/hooks/useCountdown";

interface VerifyOtpModalProps {
  open: boolean;
  type: "email" | "mobile";
  target: string;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => void;
}

const VerifyOtpModal = ({
  open,
  type,
  target,
  onClose,
  onVerify,
  onResend,
}: VerifyOtpModalProps) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { isExpired, reset, formatTime } = useCountdown(600);

  useEffect(() => {
    if (!open) return;
    setOtp("");
    setError("");
    setSuccessMsg("");
    reset();
  }, [open, type]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }
    if (isExpired) {
      setError("OTP expired, please resend.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onVerify(otp);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-pop relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <KeyRound size={22} />
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-foreground">
            Verify {type === "email" ? "Email" : "Mobile"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-foreground">{target}</span>
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (error) setError("");
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

          {error && <p className="text-center text-xs font-semibold text-destructive">{error}</p>}
          {successMsg && <p className="text-center text-xs font-semibold text-success">{successMsg}</p>}

          <p className="text-center text-xs text-muted-foreground pt-1">
            Didn’t receive the code?{" "}
            <button
              type="button"
              onClick={async () => {
                try {
                  setError("");
                  await onResend();
                  reset();
                  setOtp("");
                  setSuccessMsg("Verification code resent.");
                  setTimeout(() => setSuccessMsg(""), 3000);
                } catch (err: any) {
                  setError(err?.message || "Failed to resend code.");
                }
              }}
              className="font-semibold text-primary hover:underline focus:outline-none"
            >
              Resend Code
            </button>
          </p>

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full mt-2"
            disabled={loading || otp.length < 6}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpModal;
