import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, Camera, Eye, EyeOff, Lock, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { changePasswordService } from "@/services/auth.service";
import Spinner from "@/components/ui/spinner";
import { uploadProfilePhotoService } from "@/services/admin.service";
import { getMyProfile } from "@/services/user.service";
import { updateProfile } from "@/api/admin.api";

const SupportSettings = () => {
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

  const [profileLoading, setProfileLoading] = useState(false);
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    // role: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};

    // Name
    if (!profile.name.trim()) {
      errs.name = "Name is required";
    } else if (profile.name.trim().length < 3) {
      errs.name = "Minimum 3 characters required";
    }

    // Email
    if (!profile.email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errs.email = "Invalid email format";
    }

    // Phone
    if (!profile.phone) {
      errs.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(profile.phone)) {
      errs.phone = "Enter valid 10 digit number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
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

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();

      const user = res.data;

      setProfile({
        name: `${user.first_name || ""} ${user.last_name || ""}`,
        email: user.email || "",
        phone: user.phone || "",
        // role: user.role || "support",
      });
      if (user.profile_image) {
        setImage(`${import.meta.env.VITE_API_BASE_URL}${user.profile_image}`);
      }
    } catch (err) {
      console.log("ADMIN PROFILE ERROR:", err);
      toast.error(err?.response?.data?.message || "Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(" ");

    return {
      first_name: parts[0] || "",
      last_name: parts.slice(1).join(" ") || "",
    };
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

  const handleChange = (field: string, value: string) => {
    let updated = value;

    if (field === "email") {
      updated = value.replace(/\s/g, "");
    } else if (field === "phone") {
      updated = value.replace(/\D/g, "").slice(0, 10);
    } else if (field === "name") {
      updated = value.replace(/^\s+/, "");
    }

    setProfile((prev) => ({
      ...prev,
      [field]: updated,
    }));
  };

  const handleUpdateProfile = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setProfileLoading(true);

      const { first_name, last_name } = splitName(profile.name);

      const payload = {
        first_name,
        last_name,
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        profile_image: "https://example.com/admin-profile.jpg",
      };

      await toast.promise(updateProfile(payload), {
        loading: "Updating profile...",
        success: "Profile updated successfully.",
        error: (err) =>
          err?.response?.data?.message || "Failed to update profile.",
      });
    } catch (err: any) {
      console.log("UPDATE ERROR:", err?.response || err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB allowed");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image allowed");
      return;
    }

    try {
      setProfileLoading(true);

      // preview
      const preview = URL.createObjectURL(file);
      setImage(preview);

      // API call via service
      const uploadPromise = uploadProfilePhotoService(file);

      const res = await toast.promise(uploadPromise, {
        loading: "Uploading image...",
        success: "Profile photo updated.",
        error: "Upload failed.",
      });

      // backend image set
      setImage(`${import.meta.env.VITE_BASE_URL}${res.profile_photo}`);
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Settings
      </h1>

      {/* ==== Password SETTINGS ================= */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
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

            <Button
              onClick={handleUpdatePassword}
              disabled={passwordLoading}
              className="bg-secondary"
            >
              {passwordLoading ? <Spinner size={16} /> : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Support Profile Update */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-3xl font-bold overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt="profile"
                    className="h-full w-full object-cover"
                  />
                ) : profile.name ? (
                  profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                ) : (
                  "AD"
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                id="profileUpload"
                className="hidden"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="profileUpload"
                className="absolute left-[60px] bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-accent text-foreground hover:bg-muted transition-colors"
              >
                <Camera size={14} />
              </label>
            </div>
            <div></div>
            <div className="space-y-2">
              <Label>
                Name
                <span className="text-red-500"> *</span>
              </Label>
              <Input
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.name || ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Email
                <span className="text-red-500"> *</span>
              </Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
                className={errors.email ? "border-red-500" : ""}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.email || ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Phone
                <span className="text-red-500"> *</span>
              </Label>
              <Input
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={errors.phone ? "border-red-500" : ""}
              />
              <p className="text-xs text-red-500 min-h-[16px]">
                {errors.phone || ""}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="relative bg-secondary"
              >
                {/* Text (invisible but space preserved) */}
                <span className={profileLoading ? "opacity-0" : "opacity-100"}>
                  Save Changes
                </span>

                {/* Spinner overlay */}
                {profileLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner size={16} />
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportSettings;
