import { Link } from "react-router-dom";
import { ArrowRight, Building2, Check, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { useSignUpForm, PROVIDER_SIGNUP_DRAFT_KEY } from "@/hooks/useSignUpForm";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProviderSignupDraft } from "@/types/auth.types";

export { PROVIDER_SIGNUP_DRAFT_KEY };
export type { ProviderSignupDraft };

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
  const { t } = useTranslation();
  const {
    role,
    selectRole,
    form,
    updateField,
    updateMobile,
    error,
    fieldErrors,
    loading,
    agree,
    setAgree,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
  } = useSignUpForm();

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
                  onClick={() => selectRole(o.id)}
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
                    <Label htmlFor="fullname">{t("fullName", "Full Name")}</Label>
                    <Input
                      id="fullname"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="John Doe"
                    />
                    {fieldErrors.name && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bname">{t("businessName", "Business Name")}</Label>
                    <Input
                      id="bname"
                      value={form.businessName}
                      onChange={(e) => updateField("businessName", e.target.value)}
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
                    <Label htmlFor="remail">{t("email", "Email Address")}</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rmobile">{t("phoneNumber", "Mobile Number")}</Label>
                    <Input
                      id="rmobile"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => updateMobile(e.target.value)}
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
                  <Label htmlFor="name">{t("fullName", "Full Name")}</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={fieldErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                    placeholder="Sarah Whitfield"
                  />
                  {fieldErrors.name && (
                    <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="remail">{t("email", "Email Address")}</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rmobile">{t("phoneNumber", "Mobile Number")}</Label>
                    <Input
                      id="rmobile"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => updateMobile(e.target.value)}
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
                <Label htmlFor="rpass">{t("password", "Password")}</Label>
                <div className="relative">
                  <Input
                    id="rpass"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
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
                <Label htmlFor="rconfpass">{t("confirmPassword", "Confirm Password")}</Label>
                <div className="relative">
                  <Input
                    id="rconfpass"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
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
                  onCheckedChange={(v) => setAgree(v === true)}
                  className="mt-0.5"
                />
                <span>{t("agreeTerms", "I agree to the Terms of Service and Privacy Policy")}</span>
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
                  : t("createAccount", "Create account")}{" "}
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            {t("alreadyHaveAccount", "Already have an account?")}{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t("login", "Log in")}
            </Link>
          </p>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}

export default SignUp;
