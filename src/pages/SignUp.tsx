import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Building2, Check, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { useAuthSession } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import toast from "react-hot-toast";

export const PROVIDER_SIGNUP_DRAFT_KEY = "hollis_provider_signup_draft";

export type ProviderSignupDraft = {
  name: string;
  businessName: string;
  email: string;
  mobile: string;
  password: string;
};

const options = [
  {
    id: "customer" as const,
    icon: User,
    title: "I need a professional",
    body: "Post jobs, compare itemized proposals, schedule work and pay in one place.",
  },
  {
    id: "provider" as const,
    icon: Building2,
    title: "I am a professional",
    body: "Get matched with local homeowners, submit proposals and manage your earnings.",
  },
];

export function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuthSession();
  const [role, setRole] = useState<"customer" | "provider">(
    searchParams.get("role") === "provider" ? "provider" : "customer"
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) {
      errs.name = "Full name is required.";
    } else if (form.name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters.";
    }

    if (role === "provider") {
      if (!form.businessName.trim()) {
        errs.businessName = "Business name is required for professionals.";
      } else if (form.businessName.trim().length < 2) {
        errs.businessName = "Business name must be at least 2 characters.";
      }
    }

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    const cleanPhone = form.mobile.replace(/\D/g, "");
    if (!form.mobile.trim()) {
      errs.mobile = "Mobile number is required.";
    } else if (cleanPhone.length < 10) {
      errs.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (!form.password) {
      errs.password = "Password is required.";
    } else if (form.password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!agree) {
      errs.agree = "You must agree to the Terms and Privacy Policy.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    // Provider: collect category/coverage/credentials on onboarding (service-connect flow)
    if (role === "provider") {
      const draft: ProviderSignupDraft = {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password.trim(),
      };
      try {
        sessionStorage.setItem(PROVIDER_SIGNUP_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* ignore */
      }
      toast.success("Account details saved — continue onboarding.");
      navigate("/provider/onboarding", {
        replace: false,
        state: draft,
      });
      return;
    }

    try {
      setLoading(true);
      await register({
        full_name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.mobile.trim(),
        password: form.password.trim(),
        role: ROLES.CUSTOMER,
      });
      toast.success("Account created. Enter the OTP sent to your email.");
      navigate(
        `/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}&role=customer`,
        { replace: true }
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex flex-col items-center justify-center text-center">
            <Logo imgClassName="h-16 sm:h-20 max-h-24 w-auto" className="justify-center" />
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Join Hollis</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how you want to use the marketplace.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const active = role === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setRole(o.id);
                    setError("");
                    setFieldErrors({});
                  }}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    active
                      ? "border-accent bg-accent-soft shadow-card"
                      : "border-border bg-card hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <o.icon size={18} />
                    </span>
                    {active && <Check size={18} className="text-accent" />}
                  </div>
                  <h2 className="mt-3 font-display text-base font-bold">{o.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{o.body}</p>
                </button>
              );
            })}
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            {role === "provider" ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                      }}
                      className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="John Doe"
                    />
                    {fieldErrors.name && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bname">Business Name</Label>
                    <Input
                      id="bname"
                      value={form.businessName}
                      onChange={(e) => {
                        setForm({ ...form, businessName: e.target.value });
                        if (fieldErrors.businessName) setFieldErrors({ ...fieldErrors, businessName: undefined });
                      }}
                      className={fieldErrors.businessName ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="ABC Plumbing Co."
                    />
                    {fieldErrors.businessName && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.businessName}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="remail">Email Address</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                      }}
                      className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rmobile">Mobile Number</Label>
                    <Input
                      id="rmobile"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => {
                        setForm({ ...form, mobile: e.target.value });
                        if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: undefined });
                      }}
                      className={fieldErrors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="(512) 555-0148"
                    />
                    {fieldErrors.mobile && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.mobile}</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                    }}
                    className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                    placeholder="Sarah Whitfield"
                  />
                  {fieldErrors.name && (
                    <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="remail">Email ID</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                      }}
                      className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rmobile">Mobile Number</Label>
                    <Input
                      id="rmobile"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => {
                        setForm({ ...form, mobile: e.target.value });
                        if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: undefined });
                      }}
                      className={fieldErrors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="(512) 555-0148"
                    />
                    {fieldErrors.mobile && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.mobile}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="rpass">Password</Label>
                <div className="relative">
                  <Input
                    id="rpass"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                    }}
                    placeholder="At least 6 characters"
                    className={`pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs font-medium text-destructive">{fieldErrors.password}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rconfpass">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="rconfpass"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => {
                      setForm({ ...form, confirmPassword: e.target.value });
                      if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                    }}
                    placeholder="Confirm your password"
                    className={`pr-10 ${fieldErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <div>
              <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={agree}
                  onCheckedChange={(v) => {
                    setAgree(v === true);
                    if (fieldErrors.agree) setFieldErrors({ ...fieldErrors, agree: undefined });
                  }}
                  className="mt-0.5"
                />
                <span>I agree to the Terms and Privacy Policy.</span>
              </label>
              {fieldErrors.agree && (
                <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors.agree}</p>
              )}
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              {loading
                ? "Creating account..."
                : role === "provider"
                  ? "Continue to onboarding"
                  : "Create account"}{" "}
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}

export default SignUp;
