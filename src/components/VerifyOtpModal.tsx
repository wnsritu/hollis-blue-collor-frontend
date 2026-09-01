import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useCountdown from "@/hooks/useCountdown";
import { Clock, AlertCircle } from "lucide-react";
interface VerifyOtpModalProps {
  open: boolean;
  type: "email" | "mobile";
  target: string; // email or phone masked
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
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { time, isExpired, reset, formatTime } = useCountdown(600); // 10 min

  useEffect(() => {
    if (!open) return;

    setOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccessMsg("");

    reset(); // ✅ direct call (no timeout)
  }, [type]); // 🔥 ONLY type change pe reset
  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      const newOtp = [...otp];

      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        const prev = document.getElementById(`otp-${index - 1}`);
        prev?.focus();

        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };
  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    setError("");
    setSuccessMsg("");

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };
  const handleSubmit = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      setError("Please enter 6 digit OTP");
      return;
    }
    if (isExpired) {
      setError("OTP expired, please resend");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await onVerify(finalOtp);
      // setSuccessMsg("Verified successfully");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center">
          Verify {type === "email" ? "Email" : "Mobile"} OTP
        </h2>

        <p className="text-sm text-gray-500 text-center mt-1">
          Enter the OTP sent to {target}
        </p>

        {/* OTP Boxes */}
        <div className="flex justify-center gap-3 mt-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              value={digit}
              maxLength={1}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="
        w-10 h-10
        text-center
        text-base font-medium
        rounded-xl
        bg-gray-100
        text-gray-600

        border border-gray-200
        outline-none

        transition-all duration-150

        focus:bg-white
        focus:border-blue-400
        focus:ring-2 focus:ring-blue-100
      "
            />
          ))}
        </div>

        <p className="text-center text-sm mt-3">
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
        {error ? (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        ) : successMsg ? (
          <p className="text-green-600 text-sm text-center mt-2">
            {successMsg}
          </p>
        ) : null}

        {/* Resend */}
        <p className="text-sm text-center mt-4 text-gray-500">
          Don’t receive the OTP?{" "}
          <button
            onClick={async () => {
              try {
                setError("");
                setSuccessMsg("");

                await onResend();
                reset();
                setOtp(["", "", "", "", "", ""]);

                setSuccessMsg("OTP sent successfully");

                // auto clear success after 2 sec
                setTimeout(() => {
                  setSuccessMsg("");
                }, 2000);
              } catch (err: any) {
                setSuccessMsg("");
                setError(err?.message || "Failed to resend OTP");
              }
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            Resend
          </button>
        </p>

        {/* Button */}
        <Button
          onClick={handleSubmit}
          className="w-full mt-5"
          disabled={loading} 
        >
          {loading ? "Verifying..." : "Verify & Proceed"}
        </Button>
      </div>
    </div>
  );
};

export default VerifyOtpModal;
