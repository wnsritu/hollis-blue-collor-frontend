// components/auth/firebaseOtp.ts

import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";

let confirmationResult: any;

export const setupRecaptcha = (containerId = "recaptcha-container") => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(
      auth, // ✅ 1st: auth
      containerId, // ✅ 2nd: string id
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved");
        },
      },
    );
  }
};

export const sendOtp = async (phone: string) => {
  try {
    setupRecaptcha();

    const appVerifier = (window as any).recaptchaVerifier;

    // ✅ ALWAYS E.164 FORMAT
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\D/g, "")}`;

    console.log("SENDING OTP TO:", formattedPhone); // 🔍 debug

    confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      appVerifier,
    );

    return true;
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    throw new Error(error.message || "Failed to send OTP");
  }
};

export const verifyOtpCode = async (otp: string) => {
  if (!confirmationResult) throw new Error("Please request OTP first");

  try {
    const result = await confirmationResult.confirm(otp);

    const token = await result.user.getIdToken();

    console.log("LOGIN SUCCESS"); // ✅ debug

    return token;
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    throw new Error(error.message || "Invalid OTP");
  }
};
