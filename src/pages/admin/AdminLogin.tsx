import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Headphones, Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/services/auth.service";
import Spinner from "@/components/ui/spinner";
import { toast } from "react-hot-toast";

const LoginModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
    const ROLE_IDS = {
      admin: 1,
      agent: 2,
    };

  const [role, setRole] = useState<number>(ROLE_IDS.admin); // default admin

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  if (!open) return null;

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    let newErrors: any = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Email address is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      // setLoading(true);
      setApiError("");

    const res = await toast.promise(
      loginUser({
        email: trimmedEmail,
        password,
        role,
      }),
      {
        loading: "Logging in...",
        success: "Login successful!",
        error: (err: any) => err?.response?.data?.message || "Login failed",
      },
    );

      // ✅ Strict id-based role validation
      if (role === ROLE_IDS.admin && res.user.role_id !== ROLE_IDS.admin) {
        setApiError("Admin access only.");
        return;
      }

      if (role === ROLE_IDS.agent && res.user.role_id !== ROLE_IDS.agent) {
        setApiError("Account not found. Please contact admin.");
        return;
      }

      // ✅ Store role id in localStorage
      localStorage.setItem("token", res.token);
      localStorage.setItem("userRoleId", res.user.role_id.toString());

      onClose();

      // ✅ Navigate using roleId
      navigate(role === ROLE_IDS.admin ? "/admin" : "/support-dashboard");
    } catch (err: any) {
      setApiError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setRemember(false);
    setErrors({});
    setApiError("");
    setShowPassword(false);
    setRole(ROLE_IDS.admin); // reset to default
    onClose();
  };

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setErrors({});
    setApiError("");
    setShowPassword(false);
  };

  const isAdmin = role === ROLE_IDS.admin;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md relative rounded-xl">
        {/* CLOSE */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          ✕
        </button>

        <CardHeader className="items-center text-center">
          <div
            className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl text-white ${
              isAdmin ? "bg-blue-500" : "bg-blue-500"
            }`}
          >
            {isAdmin ? <Shield size={22} /> : <Headphones size={22} />}
          </div>

          <CardTitle className="text-2xl">
            {isAdmin ? "Admin Login" : "Support Agent Login"}
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Unik Clean — {isAdmin ? "Admin Dashboard" : "Agent Dashboard"}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 🔥 ROLE TOGGLE */}
          <div className="flex rounded-lg bg-gray-100 p-2">
            <button
              onClick={() => {
                setRole(ROLE_IDS.admin);
                resetFields();
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${
                isAdmin ? "bg-blue-500 text-white" : "text-gray-600"
              }`}
            >
              <Shield size={16} />
              Admin
            </button>

            <button
              onClick={() => {
                setRole(ROLE_IDS.agent);
                resetFields();
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${
                !isAdmin ? "bg-blue-500 text-white" : "text-gray-600"
              }`}
            >
              <Headphones size={16} />
              Support Agent
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* EMAIL */}
            <div className="space-y-1">
              <Label>
                Email
                <span className="text-red-500"> *</span>
              </Label>
              <Input
                value={email}
                placeholder={
                  isAdmin ? "admin@unikclean.com" : "agent@unikclean.com"
                }
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="relative space-y-1">
              <Label>
                Password <span className="text-red-500"> *</span>
              </Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-[34px] text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* ERROR */}
            {apiError && <div className="text-sm text-red-500">{apiError}</div>}

            {/* REMEMBER */}
            {/* <div className="flex items-center gap-2">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <Label className="text-sm">Remember Me</Label>
            </div> */}

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full relative ${
                isAdmin
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {/* Text */}
              <span className={loading ? "opacity-0" : "opacity-100"}>
                {`Login as ${isAdmin ? "Admin" : "Support Agent"}`}
              </span>

              {/* Spinner */}
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Spinner size={16} />
                </span>
              )}
            </Button>

            {/* BACK */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-blue-500"
              >
                ← Back to Home
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginModal;
