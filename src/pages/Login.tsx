import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Eye, EyeOff, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { useAuthSession } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { getErrorField, getErrorMessage } from "@/lib/api/errors";
import { resolvePostLoginPath } from "@/utils/postLoginNavigation";
import toast from "react-hot-toast";

type LoginRole = "customer" | "provider" | "admin";

const roles: {
  id: LoginRole;
  label: string;
  icon: typeof User;
}[] = [
  { id: "customer", label: "Customer", icon: User },
  { id: "provider", label: "Professional", icon: Building2 },
  { id: "admin", label: "Admin", icon: ShieldCheck },
];

function expectedRoleId(role: LoginRole): number {
  if (role === "provider") return ROLES.PROVIDER;
  if (role === "admin") return ROLES.ADMIN;
  return ROLES.CUSTOMER;
}

function roleMismatchMessage(selected: LoginRole, actualRoleId: number): string {
  const actual =
    actualRoleId === ROLES.PROVIDER
      ? "Professional"
      : actualRoleId === ROLES.ADMIN
        ? "Admin"
        : actualRoleId === ROLES.SUPPORT
          ? "Support"
          : "Customer";

  if (selected === "customer") {
    return `This is a ${actual} account. Switch to the ${actual} tab to sign in.`;
  }
  if (selected === "provider") {
    return `This is a ${actual} account. Switch to the ${actual} tab to sign in.`;
  }
  return `This is a ${actual} account. Admin login only accepts Admin accounts.`;
}

function parseDefaultRole(raw: string | null): LoginRole {
  if (raw === "provider" || raw === "admin" || raw === "customer") return raw;
  return "customer";
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, clearSession } = useAuthSession();
  const defaultRole = parseDefaultRole(searchParams.get("role"));

  const [role, setRole] = useState<LoginRole>(defaultRole);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const { user } = await login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const roleId = Number(user?.role_id);
      const expected = expectedRoleId(role);

      // Hard gate: selected tab must match account role
      if (!Number.isFinite(roleId) || roleId !== expected) {
        clearSession();
        const msg = roleMismatchMessage(
          role,
          Number.isFinite(roleId) ? roleId : -1
        );
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Login successful");

      const path = resolvePostLoginPath({
        ...(user || {}),
        email: user?.email || email.trim().toLowerCase(),
        role_id: roleId,
      });
      navigate(path, { replace: true });
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Invalid credentials");
      setError(msg);

      const emailVerifiedFlag = getErrorField<boolean>(err, "email_verified");
      const unverifiedEmail =
        getErrorField<string>(err, "email") || email.trim().toLowerCase();
      const looksUnverified =
        emailVerifiedFlag === false || /email is not verified/i.test(msg);

      // Admin accounts typically skip customer/provider verify UX
      if (looksUnverified && unverifiedEmail && role !== "admin") {
        toast.error("Email not verified. Enter the OTP sent to your inbox.");
        navigate(
          `/verify-email?email=${encodeURIComponent(unverifiedEmail)}&role=${role}`,
          { replace: true }
        );
        return;
      }
    } finally {
      setLoading(false);
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
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select your account type to proceed to your dashboard.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setError("");
                  setFieldErrors({});
                }}
                className={`rounded-xl border p-3.5 text-center transition-all ${
                  role === r.id
                    ? "border-accent bg-accent-soft font-bold shadow-sm ring-2 ring-accent/20"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <r.icon
                  size={18}
                  className={
                    role === r.id
                      ? "mx-auto text-accent"
                      : "mx-auto text-muted-foreground"
                  }
                />
                <span
                  className={`mt-1.5 block text-xs ${
                    role === r.id
                      ? "font-extrabold text-accent-soft-foreground"
                      : "font-semibold text-foreground"
                  }`}
                >
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  className={`pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs font-medium text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium">
                <Checkbox
                  defaultChecked
                  className="border-accent/60 hover:border-accent focus-visible:ring-accent data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                />{" "}
                Remember me
              </label>
              <Link
                to={`/forgot-password?role=${role}${
                  email ? `&email=${encodeURIComponent(email)}` : ""
                }`}
                className="text-sm font-medium text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>

          {role !== "admin" ? (
            <p className="mt-5 text-sm text-muted-foreground">
              New to Hollis?{" "}
              <Link
                to={
                  role === "provider" ? "/register?role=provider" : "/register"
                }
                className="font-semibold text-primary hover:underline"
              >
                Create an account
              </Link>
            </p>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              Admin access is invitation-only. Contact platform support if you
              need help.
            </p>
          )}
        </div>
      </div>
      <AuthAside />
    </div>
  );
}

export default Login;
