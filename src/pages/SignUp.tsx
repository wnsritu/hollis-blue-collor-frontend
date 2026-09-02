import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Check, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/primitives";
import { AuthAside } from "@/components/shared/AuthAside";
import { signupUser } from "@/services/auth.service";
import toast from "react-hot-toast";

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
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [error, setError] = useState("");
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

  const ROLE_MAP = {
    customer: 3,
    provider: 4,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.includes("@") || !form.mobile.trim() || form.password.length < 6) {
      setError("Please fill in all required fields with a valid email and 6+ character password.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);
      const nameParts = form.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      const payload =
        role === "customer"
          ? {
              first_name: firstName,
              last_name: lastName,
              email: form.email.trim(),
              phone: form.mobile.trim(),
              password: form.password.trim(),
              role: ROLE_MAP.customer,
            }
          : {
              first_name: firstName,
              last_name: form.businessName.trim() || lastName,
              email: form.email.trim(),
              phone: form.mobile.trim(),
              password: form.password.trim(),
              role: ROLE_MAP.provider,
            };

      await signupUser(payload);
      toast.success("Account created successfully.");
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Signup failed");
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
            <p className="mt-2 text-sm text-muted-foreground">Choose how you want to use the marketplace.</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const active = role === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setRole(o.id)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    active
                      ? "border-accent bg-accent-soft shadow-card"
                      : "border-border bg-card hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${
                        active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
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

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            {role === "provider" ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bname">Business Name</Label>
                    <Input
                      id="bname"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      placeholder="ABC Plumbing Co."
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="remail">Email Address</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rmobile">Mobile Number</Label>
                    <Input
                      id="rmobile"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="(512) 555-0148"
                    />
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
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Sarah Whitfield"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="remail">Email ID</Label>
                    <Input
                      id="remail"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rmobile">Mobile Number</Label>
                    <Input
                      id="rmobile"
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      placeholder="(512) 555-0148"
                    />
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
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rconfpass">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="rconfpass"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
              <span>
                I agree to the Terms and Privacy Policy.
              </span>
            </label>

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Creating account..." : role === "provider" ? "Continue Onboarding" : "Create account"} <ArrowRight size={16} className="ml-1" />
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
