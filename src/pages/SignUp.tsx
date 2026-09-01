import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const SignUp = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.firstName) errs.firstName = "First name is required";
    if (!form.lastName) errs.lastName = "Last name is required";
    if (!form.email) errs.email = "Email is required";
    if (!form.phone) errs.phone = "Phone number is required";
    if (!form.password) errs.password = "Password is required";
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!agree) errs.agree = "You must agree to the terms";
    setErrors(errs);
  };

  const fields: { key: string; label: string; type?: string; placeholder: string }[] = [
    { key: "firstName", label: t("firstName"), placeholder: "John" },
    { key: "lastName", label: t("lastName"), placeholder: "Doe" },
    { key: "email", label: t("email"), type: "email", placeholder: "you@example.com" },
    { key: "phone", label: t("phoneNumber"), type: "tel", placeholder: "+1 (305) 555-0123" },
    { key: "password", label: t("password"), type: "password", placeholder: "••••••••" },
    { key: "confirmPassword", label: t("confirmPassword"), type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="container-grid flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("createAccount")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join Unik Clean today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.slice(0, 2).map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-sm font-medium text-foreground">{f.label}</label>
                <Input type={f.type || "text"} value={form[f.key as keyof typeof form]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} />
                {errors[f.key] && <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>}
              </div>
            ))}
          </div>
          {fields.slice(2).map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-foreground">{f.label}</label>
              <Input type={f.type || "text"} value={form[f.key as keyof typeof form]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder} />
              {errors[f.key] && <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>}
            </div>
          ))}
          <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
            <span>{t("agreeTerms")}</span>
          </label>
          {errors.agree && <p className="text-xs text-destructive">{errors.agree}</p>}
          <Button type="submit" className="w-full">{t("createAccount")}</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline underline-offset-4 font-medium">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
