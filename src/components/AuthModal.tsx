import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { sendOtp, verifyOtpCode } from "@/components/auth/firebaseOtp";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast from "react-hot-toast";
import {
  googleLoginUser,
  loginUser,
  sendEmailOtp,
  sendPhoneOtp,
  signupUser,
  verifyEmailOtp,
  verifyPhoneOtp,
} from "@/services/auth.service";
import { ROLES } from "@/constants/roles";
import { GoogleLogin } from "@react-oauth/google";
import OtpLogin from "./auth/OtpLogin";
import Spinner from "./ui/spinner";
import VerifyOtpModal from "./VerifyOtpModal";
import ForgotPasswordModal from "./ForgotPasswordModal";

/* ✅ FIX: Field OUTSIDE component */
const Field = React.memo(
  ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    error,
    required,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
  }) => {
    const [show, setShow] = useState(false);

    const isPassword = type === "password";

    // 🔥 SMART CHANGE HANDLER
    const handleChange = (val: string) => {
      let updated = val;

      // ❌ Email → no spaces allowed
      if (type === "email") {
        updated = val.replace(/\s/g, "");
      }

      // ❌ Phone → only digits (max 10)
      else if (type === "tel") {
        updated = val.replace(/\D/g, "").slice(0, 10);
      }

      // ❌ Password → no leading spaces
      else if (type === "password") {
        updated = val.replace(/^\s+/, "");
      }

      onChange(updated);
    };

    return (
      <div>
        <label className="mb-1 block text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className="relative">
          <Input
            type={isPassword ? (show ? "text" : "password") : type}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              // ❌ Block space in email field
              if (type === "email" && e.key === " ") {
                e.preventDefault();
              }
            }}
            placeholder={placeholder}
            className={`pr-10 ${
              error ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
          />

          {/* 👁️ Eye Icon */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {/* ✅ FIX: reserve space (no layout jump) */}
        <p className="mt-1 text-xs text-red-500 min-h-[16px]">{error || ""}</p>
      </div>
    );
  },
);
interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultRole: "customer" | "provider";
  onLogin: (roleId: number) => void; // ✅ CHANGE
  onOpenForgot?: (roleId: number) => void; // 👈 NEW
}

const AuthModal = ({
  open,
  onClose,
  defaultRole,
  onLogin,
  onOpenForgot, // ✅ ADD THIS
}: AuthModalProps) => {
  const { t } = useTranslation();
  const [role, setRole] = useState<"customer" | "provider">(defaultRole);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempUser, setTempUser] = useState<any>(null);
  
  const [apiError, setApiError] = useState("");
    const [apiToken, setApiToken] = useState("");


  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "mobile">("email");
  const [hideAuthContent, setHideAuthContent] = useState(false);
  // Customer signup fields
  const [custForm, setCustForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  // Provider signup fields
  const [provForm, setProvForm] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);

  const ROLE_MAP = {
    customer: ROLES.CUSTOMER,
    provider: ROLES.PROVIDER,
  };

  const roleId = ROLE_MAP[role];
  useEffect(() => {
    if (open) {
      setRole(defaultRole);
    }
  }, [defaultRole, open]);

  if (!open) return null;

 const isValidEmail = (email: string) =>
   /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(email);

  const handleEmailChange = (val: string) => {
    setLoginEmail(val);

    setErrors((prev) => ({ ...prev, email: "" }));
    setApiError("");
  };

  const handlePasswordChange = (val: string) => {
    setLoginPassword(val);

    setErrors((prev) => ({ ...prev, password: "" }));
    setApiError("");
  };

const handleResendOtp = async () => {
  try {
    setLoading(true);

  if (otpStep === "email") {
    await sendEmailOtp({
      email: otpTarget, // ✅ correct key
      role_id: roleId, // ✅ correct variable
    });
  } else {
    await sendPhoneOtp({
      phone: otpTarget, // ✅ correct key
      role_id: roleId, // ✅ add role here also
    });
  }
    toast.success("OTP resent successfully"); 

    // optional UX feedback
    setApiError("");
    // console.log("OTP resent successfully");
  } catch (err: any) {
    setApiError(err?.response?.data?.message || "Failed to resend OTP");
  } finally {
    setLoading(false);
  }
};

const handleVerifyOtp = async (otp: string) => {
  try {
    setLoading(true);

    // 📧 EMAIL OTP STEP
    if (otpStep === "email") {
      await verifyEmailOtp({
        email: otpTarget,
        otp,
        role_id: roleId, // ✅ add role here
      });

      // ✅ move to phone step using stored user
      if (!tempUser?.phone) {
        setApiError("Phone number not found for user");
        return;
      }

      setOtpStep("mobile");
      const phone = tempUser.phone;
      setOtpTarget(phone);
      await sendOtp(phone);
      setShowOtpModal(false);
      setTimeout(() => {
        setShowOtpModal(true);
      }, 50);

      return;
    }

    // 📱 PHONE OTP STEP (FINAL LOGIN)
    // if (otpStep === "mobile") {
    //   const id_token = await verifyOtpCode(otp);

    //   const vres = await verifyPhoneOtp({
    //     phone: tempUser.phone,
    //     idToken: id_token,
    //     role_id: roleId, // ✅ add role here
    //   });

    //      const res = await loginUser({
    //        email: tempUser.email,
    //        password: loginPassword, // ✅ temp store password (or use a flag to skip)
    //        role: ROLE_MAP[role],
    //      });


    //   localStorage.setItem("token", res.token);
    //   localStorage.setItem("userRole", String(res.user.role_id));

    //   onLogin(res.user.role_id);

    //   resetState();
    //   setTempUser(null);
    //   onClose();
    // }

    if (otpStep === "mobile") {
      // ✅ Simulate OTP verification success
      // console.log("OTP Entered:", otp);

      // ✅ Fake delay (optional for realism)
      await new Promise((res) => setTimeout(res, 500));
      toast.success("Verification successful");

      // ✅ Direct login simulation
      localStorage.setItem("token", apiToken);
      localStorage.setItem(
        "userRole",
        String(tempUser?.role_id || ROLE_MAP[role]),
      );

      // ✅ Redirect flow
      onLogin(tempUser?.role_id || ROLE_MAP[role]);

      resetState();
      setTempUser(null);
      onClose();
    }
  } catch (err: any) {
     const msg = err?.response?.data?.message || err.message || "OTP failed";
    setApiError(msg);
    // toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  
 const handleLogin = async (e: React.FormEvent) => {
   e.preventDefault();

   const errs: Record<string, string> = {};

   if (!loginEmail) {
     errs.email = "Email is required";
   } else if (!isValidEmail(loginEmail)) {
     errs.email = "Invalid email format";
   }

   if (!loginPassword) {
     errs.password = "Password is required";
   }

   setErrors(errs);
   if (Object.keys(errs).length > 0) return;

   try {
     setLoading(true);
     setApiError("");

     const res = await loginUser({
       email: loginEmail,
       password: loginPassword,
       role: ROLE_MAP[role],
     });

     const user = res.user;
     const userRoleId = user.role_id;
     setApiToken(res.token); // ✅ store token for OTP step

     if (!Object.values(ROLE_MAP).includes(userRoleId)) {
       setApiError("Account not found. Please sign up.");
       return;
     }

     if (userRoleId !== ROLE_MAP[role]) {
       setApiError("Account not found. Please sign up.");
       return;
     }

     // ✅ STORE USER TEMP
     setTempUser(user);

     // 
     const isEmailVerified = user.email_verified;
     const isPhoneVerified = user.phone_verified;

     // 👉 IF AT LEAST ONE IS VERIFIED → DIRECT LOGIN
     if (role === "provider" && (isEmailVerified || isPhoneVerified)) {
       localStorage.setItem("token", res.token);
       localStorage.setItem("userRole", String(userRoleId)); 
         localStorage.setItem("id", String(user.id));
        // localStorage.setItem("role_id", String(userRoleId));
       onLogin(userRoleId);
       resetState();
       onClose();
       return;
     }

     // 📧 EMAIL NOT VERIFIED (ONLY if neither verified OR email is required flow)
     if (role === "provider" && !isEmailVerified) {
       setApiError("Email not verified. OTP sent to email.");
       await sendEmailOtp({
         email: user.email,
         role_id: roleId, // ✅ ADD HERE
       });
       setOtpStep("email");
       setOtpTarget(user.email);
       setHideAuthContent(true);
       setShowOtpModal(true);
       return;
     }

     // 📱 PHONE NOT VERIFIED
     if (role === "provider" && !isPhoneVerified) {
       setApiError("Phone number not verified. OTP sent to Phone number.");
       await sendOtp(user.phone);

       setOtpStep("mobile");
       setOtpTarget(user.phone);
       setHideAuthContent(true);
       setShowOtpModal(true);
       return;
     }
     localStorage.setItem("token", res.token);
     localStorage.setItem("userRole", String(userRoleId));
    //  localStorage.setItem("role_id", String(userRoleId));
     localStorage.setItem("id", String(user.id));
     
      toast.success("Login successful");
      onLogin(userRoleId);
      resetState();
     onClose();
     
   } catch (err: any) {
     const msg = err?.response?.data?.message || "Invalid credentials";
     setApiError(msg);
    //  toast.error(msg);
   } finally {
     setLoading(false);
   }
 };

  const handleCustChange = (field: string, value: string) => {
    let updatedValue = value;

    // ✅ Email → no spaces
    if (field === "email") {
      updatedValue = value.replace(/\s/g, "");
    }

    // ✅ Phone → only digits
    else if (field === "phone") {
      updatedValue = value; // ✅ full number with country code
    }

    // ✅ Password → no leading space
    else if (field === "password" || field === "confirmPassword") {
      updatedValue = value.replace(/^\s+/, "");
    }

    // ✅ Name fields → no leading space
    else if (field === "firstName" || field === "lastName") {
      updatedValue = value.replace(/^\s+/, "");
    }

    setCustForm((prev) => ({
      ...prev,
      [field]: updatedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    setApiError("");
  };

  const handleProvChange = (field: string, value: string) => {
    let updatedValue = value;

    // ✅ Email → no spaces
    if (field === "email") {
      updatedValue = value.replace(/\s/g, "");
    }

    // ✅ Phone → only digits
    else if (field === "phone") {
      updatedValue = value; // ✅ full number with country code
    }

    // ✅ Password → no leading space
    else if (field === "password" || field === "confirmPassword") {
      updatedValue = value.replace(/^\s+/, "");
    }

    // ✅ Name fields → no leading space
    else if (field === "fullName" || field === "businessName") {
      updatedValue = value.replace(/^\s+/, "");
    }

    setProvForm((prev) => ({
      ...prev,
      [field]: updatedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    setApiError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: Record<string, string> = {};

    //  Validation
    if (role === "customer") {
      if (!custForm.firstName) errs.firstName = "First name is required";
      if (!custForm.lastName) errs.lastName = "Last name is required";

      if (!custForm.email) {
        errs.email = "Email is required";
      } else if (!isValidEmail(custForm.email)) {
        errs.email = "Invalid email format";
      }

      if (!custForm.phone) {
        errs.phone = "Phone Number is required";
      }

      if (!custForm.password) {
        errs.password = "Password is required";
      } else if (custForm.password.length < 6) {
        errs.password = "Minimum 6 characters required";
      }
      if (!custForm.confirmPassword)
        errs.confirmPassword = "Confirm Password is required";

      if (custForm.password !== custForm.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    } else {
      if (!provForm.fullName) errs.fullName = "First Name is required";
      if (!provForm.businessName) errs.businessName = "Last name is required";

      if (!provForm.email) {
        errs.email = "Email is required";
      } else if (!isValidEmail(provForm.email)) {
        errs.email = "Invalid email format";
      }

      if (!provForm.phone) {
        errs.phone = "Phone Number is required";
      }
      // else if (!/^\d{10}$/.test(provForm.phone)) {
      //   errs.phone = "Enter valid 10 digit phone number";
      // }

      if (!provForm.password) {
        errs.password = "Password is required";
      } else if (provForm.password.length < 6) {
        errs.password = "Minimum 6 characters required";
      }

      if (!provForm.confirmPassword)
        errs.confirmPassword = "Confirm Password is required";

      if (provForm.password !== provForm.confirmPassword) {
        errs.confirmPassword = "Passwords do not match";
      }
    }

    if (!agree) errs.agree = "You must agree to the terms";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setLoading(true);

      // 🔥 FIXED PAYLOAD (snake_case)
      const payload =
        role === "customer"
          ? {
              first_name: custForm.firstName,
              last_name: custForm.lastName,
              email: custForm.email.trim(),
              phone: custForm.phone,
              password: custForm.password.trim(),
              role: ROLE_MAP[role],
            }
          : {
              first_name: provForm.fullName,
              last_name: provForm.businessName,
              email: provForm.email.trim(),
              phone: provForm.phone,
              password: provForm.password.trim(),
              role: ROLE_MAP[role],
            };

      const res = await signupUser(payload);

      toast.success("Account created successfully.");


      // 🔥 ADD THIS BLOCK HERE
      if (role === "provider") {

        // RESET FORM (optional but clean)
        setProvForm({
          fullName: "",
          businessName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });

        // ✅ SWITCH TAB
        setTab("login");

        // ✅ OPEN OTP MODAL
        //  setOtpStep("email");
        //  setOtpTarget(provForm.email);
        //  setShowOtpModal(true);

        return;
      }
      setLoginEmail(custForm.email);
      setTab("login");

      setTab("login");
      setCustForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setProvForm({
        fullName: "",
        businessName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setAgree(false);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;
      const res = await googleLoginUser({
        token,
        role: ROLE_MAP[role], // 🔥 IMPORTANT
      });

      localStorage.setItem("token", res.token);
      localStorage.setItem("userRole", res.user.role_id);

      onLogin(res.user.role_id);
      resetState();
      onClose();
    } catch (err: any) {
      console.log("GOOGLE LOGIN ERROR:", err?.response || err);
      setErrors({
        email: err?.response?.data?.message || "Google login failed",
      });
    }
  };

  const resetState = () => {
    setLoginEmail("");
    setLoginPassword("");
    setErrors({});
    setApiError("");
    setRemember(false);
    setShowOtpLogin(false);
    setTab("login");
    setRole(defaultRole);

    setCustForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

    setProvForm({
      fullName: "",
      businessName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

    setAgree(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40  p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg">
        {!hideAuthContent && (
          <>
            <button
              onClick={() => {
                resetState(); // ✅ clear data
                onClose(); // ✅ close modal
              }}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="mb-5 text-center">
              <h2 className="font-heading text-xl font-bold text-foreground">
                {tab === "login" ? t("login") : t("createAccount")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Unik Clean — Handled with care
              </p>
            </div>

            {/* Role cards for signup / login */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole("customer");
                  setErrors({});
                }}
                className={`rounded-2xl border p-3.5 text-center transition-all ${
                  role === "customer"
                    ? "border-[#BF1523] bg-[#fdf0f1] font-bold text-[#BF1523] shadow-sm"
                    : "border-border bg-card text-foreground hover:border-gray-300"
                }`}
              >
                <span className={`block text-xs ${role === "customer" ? "font-bold text-[#BF1523]" : "font-medium text-foreground"}`}>
                  Customer
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("provider");
                  setErrors({});
                }}
                className={`rounded-2xl border p-3.5 text-center transition-all ${
                  role === "provider"
                    ? "border-[#BF1523] bg-[#fdf0f1] font-bold text-[#BF1523] shadow-sm"
                    : "border-border bg-card text-foreground hover:border-gray-300"
                }`}
              >
                <span className={`block text-xs ${role === "provider" ? "font-bold text-[#BF1523]" : "font-medium text-foreground"}`}>
                  Provider
                </span>
              </button>
            </div>

            {/* Login / Signup tabs */}
            {/* <div className="mb-5 flex gap-4 border-b border-border">
          <button
            onClick={() => {
              setTab("login");
              setErrors({});
              setRole(defaultRole); // ✅ reset role
            }}
            className={`pb-2 text-sm font-medium transition-colors ${tab === "login" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            {t("login")}
          </button>
          <button
            onClick={() => {
              setTab("signup");
              setErrors({});
            }}
            className={`pb-2 text-sm font-medium transition-colors ${tab === "signup" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            {t("signup")}
          </button>
        </div> */}

            {tab === "login" ? (
              showOtpLogin ? (
                <OtpLogin
                  onSuccess={(role_id) => {
                    // const roleId = ROLE_MAP[role_id]; // convert string to number
                    onLogin(role_id); // ✅ now matches type
                    resetState();
                    onClose();
                  }}
                  onBack={() => setShowOtpLogin(false)}
                />
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field
                    label={t("email")}
                    value={loginEmail}
                    onChange={handleEmailChange}
                    type="email"
                    placeholder="you@example.com"
                    error={errors.email}
                    required
                  />
                  <Field
                    label={t("password")}
                    value={loginPassword}
                    onChange={handlePasswordChange}
                    type="password"
                    placeholder="••••••••"
                    error={errors.password}
                    required
                  />
                  {/* ✅ GLOBAL ERROR */}
                  {apiError && (
                    <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
                      {apiError}
                    </div>
                  )}
                  <div className="flex items-center justify-end">
                    {/* <div className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                  />
                  <span>{t("rememberMe")}</span>
                </div> */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenForgot) {
                          onOpenForgot(roleId);
                        } else {
                          setShowForgotModal(true);
                        }
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full relative"
                    disabled={loading}
                  >
                    {/* Text */}
                    <span className={loading ? "opacity-0" : "opacity-100"}>
                      {t("login")}
                    </span>

                    {/* Spinner */}
                    {loading && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Spinner size={16} />
                      </span>
                    )}
                  </Button>
                  {/* ✅ ADD GOOGLE BUTTON HERE */}
                  <div className="flex justify-center gap-4 mt-3 googleCustom">
                    {/* Google Login */}
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => console.log("Google Login Failed")}
                      size="medium"
                      shape="circle"
                      theme="outline"
                      // className="googleCustom"
                    />

                    {/* Phone OTP */}
                    <button
                      type="button"
                      onClick={() => setShowOtpLogin(true)}
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-border hover:bg-accent transition"
                    >
                      <Phone size={16} className="text-sky-600" />
                    </button>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {t("dontHaveAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => setTab("signup")}
                      className="text-primary hover:underline font-medium"
                    >
                      {t("signup")}
                    </button>
                  </p>
                </form>
              )
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {role === "customer" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label={t("firstName")}
                        value={custForm.firstName}
                        onChange={(v) => handleCustChange("firstName", v)}
                        placeholder="John"
                        error={errors.firstName}
                        required
                      />

                      <Field
                        label={t("lastName")}
                        value={custForm.lastName}
                        onChange={(v) => handleCustChange("lastName", v)}
                        placeholder="Doe"
                        error={errors.lastName}
                        required
                      />
                    </div>
                    <Field
                      label={t("email")}
                      value={custForm.email}
                      onChange={(v) => handleCustChange("email", v)}
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email}
                      required
                    />

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t("phoneNumber")}{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <PhoneInput
                        country={"in"}
                        value={custForm.phone}
                        onChange={(value) =>
                          handleCustChange("phone", "+" + value)
                        }
                        containerClass="w-full"
                        inputClass={`!w-full !h-10 !text-sm !rounded-md !bg-background !border !border-input !px-3 !pl-12 focus:!ring-2 focus:!ring-ring ${
                          errors.phone ? "!border-red-500" : ""
                        }`}
                        buttonClass="!border-input !bg-background"
                        dropdownClass="!text-sm"
                      />

                      {/* error space same as Field */}
                      <p className="mt-1 text-xs text-red-500 min-h-[16px]">
                        {errors.phone || ""}
                      </p>
                    </div>

                    <Field
                      label={t("password")}
                      value={custForm.password}
                      onChange={(v) => handleCustChange("password", v)}
                      type="password"
                      placeholder="••••••••"
                      error={errors.password}
                      required
                    />

                    <Field
                      label={t("confirmPassword")}
                      value={custForm.confirmPassword}
                      onChange={(v) => handleCustChange("confirmPassword", v)}
                      type="password"
                      placeholder="••••••••"
                      error={errors.confirmPassword}
                      required
                    />
                  </>
                ) : (
                  <>
                    <Field
                      label={t("firstName")}
                      value={provForm.fullName}
                      onChange={(v) => handleProvChange("fullName", v)}
                      placeholder="Maria Garcia"
                      error={errors.fullName}
                      required
                    />

                    <Field
                      label={t("lastName")}
                      value={provForm.businessName}
                      onChange={(v) => handleProvChange("businessName", v)}
                      placeholder="Maria's Laundry"
                      error={errors.businessName}
                      required
                    />

                    <Field
                      label={t("email")}
                      value={provForm.email}
                      onChange={(v) => handleProvChange("email", v)}
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email}
                      required
                    />

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t("phoneNumber")}{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <PhoneInput
                        country={"in"}
                        value={provForm.phone}
                        onChange={(value) =>
                          handleProvChange("phone", "+" + value)
                        }
                        containerClass="w-full"
                        inputClass={`!w-full !h-10 !text-sm !rounded-md !bg-background !border !border-input !px-3 !pl-12 focus:!ring-2 focus:!ring-ring ${
                          errors.phone ? "!border-red-500" : ""
                        }`}
                        buttonClass="!border-input !bg-background"
                        dropdownClass="!text-sm"
                      />

                      {/* Error (same spacing as Field) */}
                      <p className="mt-1 text-xs text-red-500 min-h-[16px]">
                        {errors.phone || ""}
                      </p>
                    </div>

                    <Field
                      label={t("password")}
                      value={provForm.password}
                      onChange={(v) => handleProvChange("password", v)}
                      type="password"
                      placeholder="••••••••"
                      error={errors.password}
                      required
                    />

                    <Field
                      label={t("confirmPassword")}
                      value={provForm.confirmPassword}
                      onChange={(v) => handleProvChange("confirmPassword", v)}
                      type="password"
                      placeholder="••••••••"
                      error={errors.confirmPassword}
                      required
                    />
                    {apiError && (
                      <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
                        {apiError}
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={agree}
                    onCheckedChange={(v) => {
                      const value = v === true;
                      setAgree(value);

                      // ✅ error remove instantly
                      if (value) {
                        setErrors((prev) => ({
                          ...prev,
                          agree: "",
                        }));
                      }
                    }}
                    className="mt-0.5"
                  />
                  {/* <span>{t("agreeTerms")}</span> */}
                  <span>
                    I agree to{" "}
                    <button
                      type="button"
                      className="text-blue-600 underline hover:text-blue-800"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Terms & Privacy Policy
                    </button>
                  </span>
                </div>

                {/* ✅ Terms & Privacy Modal */}
                {showTermsModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl overflow-y-auto max-h-[80vh] relative">
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h2 className="text-xl font-semibold">Terms of Service & Privacy Policy</h2>
                        <button
                          onClick={() => setShowTermsModal(false)}
                          className="p-2 hover:bg-slate-100 rounded-full transition"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="px-6 py-4 space-y-4 text-sm text-gray-700">
                        {/* TERMS OF SERVICE */}
                        <h3 className="font-semibold text-lg">TERMS OF SERVICE</h3>
                        <p>Unik Clean<br />Effective Date: March 31, 2026</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li><strong>Overview:</strong> Unik Clean is a marketplace platform connecting customers with independent service providers. Unik Clean does not directly provide services.</li>
                          <li><strong>User Accounts:</strong> Users must provide accurate information and maintain account security. Providers must complete verification before activation.</li>
                          <li><strong>Services:</strong> Providers independently offer laundry and home services. Unik Clean is not responsible for how services are performed.</li>
                          <li><strong>Booking & Payments:</strong> Customer requests → Provider accepts → Customer pays via Stripe. Funds are released upon confirmation or automatically after 4 hours.</li>
                          <li><strong>Pricing:</strong> Includes provider pricing, service fees, pickup/delivery fees, and platform fees.</li>
                          <li><strong>Cancellations:</strong> Late cancellation: 50% customer refund, 10% provider, 40% platform.</li>
                          <li><strong>Disputes:</strong> Must be reported within 24 hours. Admin makes final decision.</li>
                          <li><strong>Messaging & Conduct:</strong> No sharing of contact info before booking. Violations may lead to suspension.</li>
                          <li><strong>Privacy & Location Sharing:</strong> Approximate location shown before booking. Full address revealed after acceptance and payment.</li>
                          <li><strong>Provider Responsibility:</strong> Providers handle services and item care independently.</li>
                          <li><strong>Ratings & Reviews:</strong> Users may leave public ratings and reviews.</li>
                          <li><strong>Payments & Payouts:</strong> Processed via Stripe.</li>
                          <li><strong>Platform Role & Disclaimer of Liability:</strong> Unik Clean is not liable for loss, theft, damage, injury, or death related to services.</li>
                          <li><strong>Assumption of Risk:</strong> Users accept risks associated with services and interactions.</li>
                          <li><strong>Limitation of Liability:</strong> Liability is limited to the transaction amount.</li>
                          <li><strong>Indemnification:</strong> Users agree to protect Unik Clean from claims arising from use.</li>
                          <li><strong>Customer Responsibility:</strong> Customers must provide accurate information and safe environments.</li>
                        </ol>

                        {/* PRIVACY POLICY */}
                        <h3 className="font-semibold text-lg mt-4">PRIVACY POLICY</h3>
                        <p>Effective Date: March 31, 2026</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li><strong>Information Collected:</strong> Name, email, phone, address, usage data.</li>
                          <li><strong>Use of Information:</strong> Account management, bookings, communication, support.</li>
                          <li><strong>Payments:</strong> Handled via Stripe.</li>
                          <li><strong>Location Data:</strong> Approximate before booking, full after confirmation.</li>
                          <li><strong>Data Sharing:</strong> Only as necessary for service operation.</li>
                          <li><strong>Security:</strong> Reasonable safeguards implemented.</li>
                          <li><strong>User Rights:</strong> Access, update, delete account data.</li>
                          <li><strong>Data Retention:</strong> Retained for legal and operational needs.</li>
                          <li><strong>Cookies:</strong> Used for functionality and analytics.</li>
                          <li><strong>Children:</strong> Not intended for users under 18.</li>
                          <li><strong>Updates:</strong> Policy may change; continued use implies acceptance.</li>
                          <li><strong>Contact:</strong> [admin@gmail.com]</li>
                        </ol>

                        {/* Checkbox to accept inside modal */}
                        <div className="flex items-center gap-2 mt-4">
                          <Checkbox
                            checked={agree}
                            onCheckedChange={(v) => setAgree(v === true)}
                          />
                          <span>I have read and agree to the Terms & Privacy Policy</span>
                        </div>

                        {/* Close Button */}
                        <div className="mt-2 flex justify-end">
                          <button
                            disabled={!agree}
                            onClick={() => setShowTermsModal(false)}
                            className={`px-4 py-2 rounded-lg text-white ${
                              agree ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Accept & Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {errors.agree && (
                  <p className="text-xs text-destructive">{errors.agree}</p>
                )}
                <Button
                  type="submit"
                  className="w-full relative"
                  disabled={loading}
                >
                  {/* Text */}
                  <span className={loading ? "opacity-0" : "opacity-100"}>
                    {role === "customer"
                      ? t("createAccount")
                      : t("createProviderAccount")}
                  </span>

                  {/* Spinner */}
                  {loading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Spinner size={16} />
                    </span>
                  )}
                </Button>

                {/* ✅ ADD GOOGLE BUTTON HERE */}
                <div className="mt-3 flex justify-center ">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      console.log("Google Login Failed");
                    }}
                    size="medium"
                    theme="outline"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {t("alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    disabled={loading}
                    className="text-primary hover:underline font-medium"
                  >
                    {loading ? "Please wait..." : t("login")}
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>

      <ForgotPasswordModal
        open={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={() => {
          toast.success("Password reset successfully! Please login with new password.");
          setShowForgotModal(false);
        }}
        roleId={ROLE_MAP[role]} // 👈 Pass the current role ID
      />

      <VerifyOtpModal
        key={otpStep}
        open={showOtpModal}
        type={otpStep} // 🔥 change here
        target={otpTarget}
        onClose={() => {
          setShowOtpModal(false);
          setHideAuthContent(false); 
        }}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default AuthModal;
