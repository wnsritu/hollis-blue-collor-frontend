import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
  };

  return (
    <div className="container-grid flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("login")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back to Unik Clean
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("email")}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("password")}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <span>{t("rememberMe")}</span>
            </div>
            <button
              type="button"
              className="text-sm text-primary hover:underline underline-offset-4"
            >
              {t("forgotPassword")}
            </button>
          </div>
          <Button type="submit" className="w-full">
            {t("login")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("dontHaveAccount")}{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline underline-offset-4 font-medium"
          >
            {t("signup")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
