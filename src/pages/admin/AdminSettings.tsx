import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { changePasswordService } from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { getPlatformSettings, updatePlatformSettings } from "@/api/admin.api";

const AdminSettings = () => {

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passErrors, setPassErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [platform, setPlatform] = useState({
    name: "Unik Clean",
    email: "unik2help@gmail.com",
  });

  const [commission, setCommission] = useState("15");
  const [platformFee, setPlatformFee] = useState("2.50");

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
    console.log("Platform Settings:", platform);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPlatformSettings();
        setCommission(data?.data.admin_commission.toString());
        setPlatformFee(data?.data.platform_fee.toString());
      } catch (err) {
        toast.error("Failed to fetch platform settings");
      }
    };

    fetchSettings();
  }, []);

  const handleSaveFees = async () => {
    try {
      const payload = {
        admin_commission: parseFloat(commission),
        platform_fee: parseFloat(platformFee),
      };
      await toast.promise(updatePlatformSettings(payload), {
        loading: "Updating fees...",
        success: "Fees updated successfully",
        error: "Failed to update fees",
      });
    } catch (err) {
      console.log(err);
    }
  };

  const validatePassword = () => {
    const errs: Record<string, string> = {};

    if (!passwords.current) errs.current = "Current password is required";

    if (!passwords.new) errs.new = "New password is required";
    else if (passwords.new.length < 6)
      errs.new = "Minimum 6 characters required";

    if (!passwords.confirm) errs.confirm = "Confirm password is required";
    else if (passwords.new !== passwords.confirm)
      errs.confirm = "Passwords do not match";

    setPassErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      toast.error("Please fix password errors");
      return;
    }

    try {
      setPasswordLoading(true);

      const payload = {
        old_password: passwords.current,
        new_password: passwords.new,
      };

      await toast.promise(changePasswordService(payload), {
        loading: "Updating password...",
        success: "Password updated successfully",
        error: (err) =>
          err?.response?.data?.message || "Failed to update password",
      });

      setPasswords({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Settings
      </h1>

      {/* ================= PLATFORM SETTINGS ================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                readOnly
                value={platform.name}
                onChange={(e) =>
                  setPlatform({ ...platform, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                readOnly
                type="email"
                value={platform.email}
                onChange={(e) =>
                  setPlatform({ ...platform, email: e.target.value })
                }
              />
            </div>

            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* ================= PASSWORD CARD (LIKE YOUR SCREENSHOT) ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base" >Change Password</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={show.current ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.current}
                  onChange={(e) => {
                    setPasswords({ ...passwords, current: e.target.value });
                    setPassErrors({ ...passErrors, current: "" });
                  }}
                  className={
                    passErrors.current ? "border-red-500 pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShow({ ...show, current: !show.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-red-500">{passErrors.current}</p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={show.new ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.new}
                  onChange={(e) => {
                    setPasswords({ ...passwords, new: e.target.value });
                    setPassErrors({ ...passErrors, new: "" });
                  }}
                  className={passErrors.new ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShow({ ...show, new: !show.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {show.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-red-500">{passErrors.new}</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={show.confirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.confirm}
                  onChange={(e) => {
                    setPasswords({ ...passwords, confirm: e.target.value });
                    setPassErrors({ ...passErrors, confirm: "" });
                  }}
                  className={
                    passErrors.confirm ? "border-red-500 pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShow({ ...show, confirm: !show.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-red-500">{passErrors.confirm}</p>
            </div>

            <Button onClick={handleUpdatePassword} disabled={passwordLoading}>
              {passwordLoading ? <Spinner size={16} /> : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ================= SERVICE FEE MANAGEMENT ================= */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Service Fee Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Book professional laundry services handled with care.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Commission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">% Admin Commission</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Label>Commission Rate (%)</Label>
              <Input
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Applied to all orders on the platform.
              </p>
            </CardContent>
          </Card>

          {/* Platform Fee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">$ Platform Fee</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Label>Platform Fee ($)</Label>
              <Input
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Fixed fee per transaction.
              </p>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSaveFees} className="mt-2">
          Save Fees
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
