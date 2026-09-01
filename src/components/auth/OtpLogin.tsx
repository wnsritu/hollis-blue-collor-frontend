// components/auth/OtpLogin.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOtp, verifyOtpCode } from "./firebaseOtp";
import { loginWithOTP } from "@/services/auth.service";
import Spinner from "../ui/spinner";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import useCountdown from "@/hooks/useCountdown";
import toast from "react-hot-toast";
interface OtpLoginProps {
  onSuccess: (role_id: 3 | 4) => void;
  onBack: () => void;
}

const OtpLogin = ({ onSuccess, onBack }: OtpLoginProps) => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const { time, isExpired, reset, formatTime } = useCountdown(600);
const otpValue = otp.join("");
  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);


  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        const prev = document.getElementById(`otp-${index - 1}`);
        prev?.focus();

        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleSendOtp = async () => {
     if (!phone || phone.length < 8) {
       setError("Phone number is required");
       return;
     }
    try {
      setError("");
      await toast.promise(
        (async () => {
          return await sendOtp(phone);
        })(),
        {
          loading: "Sending OTP...",
          success: "OTP sent successfully.",
          error: (err) =>
            err?.response?.data?.message ||
            err?.message ||
            "Failed to send OTP",
        },
      );

      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      // setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
   
      if (!otpValue) {
        setError("OTP is required");
        return;
      }

   // ✅ validate OTP
   if (otpValue.length !== 6) {
     setError("Please enter a valid 6-digit OTP");
     return;
   }

   try {
     setError("");

      await toast.promise(
        (async () => {
          const firebaseToken = await verifyOtpCode(otpValue);

          const response = await loginWithOTP(firebaseToken);

          localStorage.setItem("token", response.token);
          localStorage.setItem("userRole", response.user.role_id.toString());

          return response;
        })(),
        {
          loading: "Verifying OTP...",
          success: "Login successful.",
          error: (err) =>
            err?.response?.data?.message || err?.message || "Invalid OTP",
        },
      );

     onSuccess(((await loginWithOTP) as any)?.user?.role_id);
   } catch (err: any) {
    //  setError(err.message || "Invalid OTP");
   } finally {
     setLoading(false);
   }
 };

 const handleResendOtp = async () => {
    if (!isExpired) {
      toast.error("Please wait until OTP expires");
      return;
    }

   try {
     setLoading(true);
     setError("");
     await sendOtp(phone);
     reset();
     toast.success("OTP resent successfully");
   } catch (err: any) {
     setError(err.message || "Failed to resend OTP");
   } finally {
     setLoading(false);
   }
 };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              country={"in"}
              value={phone}
              onChange={(value) => setPhone(value)}
              containerClass="w-full"
              inputClass="!w-full !h-10 !text-sm !rounded-md !bg-background !border !border-input !px-3 !pl-12"
              buttonClass="!border-input !bg-background"
              dropdownClass="!text-sm"
            />
            {/* <p className="mt-1 text-xs text-muted-foreground">
              Enter 10-digit mobile number
            </p> */}
          </div>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <Button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full relative"
          >
            {/* Text (space preserved) */}
            <span
              className={`transition-opacity duration-200 ${
                loading ? "opacity-0" : "opacity-100"
              }`}
            >
              Send OTP
            </span>

            {/* Spinner overlay */}
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size={16} />
              </span>
            )}
          </Button>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-[20px] font-semibold text-center text-gray-800">
              Verify OTP
            </h2>

            <p className="text-center text-gray-500 text-[14px] mt-1 mb-4">
              Enter the OTP sent to{" "}
              <span className="font-medium">+{phone}</span>
            </p>

            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="
                  w-[40px] h-[42px]
                  text-center
                  border border-gray-300
                  rounded-lg
                  text-[16px] font-medium
                  text-gray-700
                  focus:border-blue-500
                  focus:ring-1 focus:ring-blue-200
                  outline-none
                  "
                />
              ))}
            </div>
            <p className="text-center text-sm mt-2">
              {isExpired ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 font-medium">
                  OTP Expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  Expires in
                  <span className="font-semibold tracking-wide">
                    {formatTime()}
                  </span>
                </span>
              )}
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading}
            className="w-full relative"
          >
            {/* Text (space preserved) */}
            <span className={loading ? "opacity-0" : "opacity-100"}>
              Verify & Login
            </span>

            {/* Spinner center */}
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size={16} />
              </span>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!isExpired}
              className={`text-sm ${
                !isExpired
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-primary hover:underline"
              }`}
            >
              Resend OTP
            </button>
          </div>
        </>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to Login
        </button>
      </div>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default OtpLogin;
