import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { loginUser } from "@/services/auth.service";
import toast from "react-hot-toast";

const roles = [
  { id: "customer" as const, label: "Customer", icon: User },
  { id: "provider" as const, label: "Professional", icon: Building2 },
];

export function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [email, setEmail] = useState("sarah.whitfield@gmail.com");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ROLE_MAP = {
    customer: 3,
    provider: 4,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({
        email: email.trim(),
        password: password.trim(),
        role: ROLE_MAP[role],
      });

      const user = res.user;
      localStorage.setItem("token", res.token);
      localStorage.setItem("userRole", String(user.role_id));
      localStorage.setItem("id", String(user.id));

      toast.success("Login successful");

      if (user.role_id === ROLE_MAP.provider) {
        navigate("/provider/dashboard");
      } else if (user.role_id === ROLE_MAP.customer) {
        navigate("/dashboard");
      } else {
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col items-center justify-center text-center">
            <Logo imgClassName="h-16 sm:h-20 max-h-24 w-auto" className="justify-center" />
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select your account type to proceed to your dashboard.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`rounded-xl border p-3.5 text-center transition-all ${
                  role === r.id
                    ? "border-accent bg-accent-soft shadow-sm ring-2 ring-accent/20 font-bold"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <r.icon
                  size={18}
                  className={role === r.id ? "mx-auto text-accent" : "mx-auto text-muted-foreground"}
                />
                <span
                  className={`mt-1.5 block text-xs ${
                    role === r.id ? "font-extrabold text-accent-soft-foreground" : "font-semibold text-foreground"
                  }`}
                >
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                <Checkbox defaultChecked /> Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            New to Hollis?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
      <AuthAside />
    </div>
  );
}

export default Login;
