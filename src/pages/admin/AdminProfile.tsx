import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Shield, Clock } from "lucide-react";
import { getMyProfile } from "@/services/user.service";
import { updateProfile } from "@/api/admin.api";
import { changePasswordService } from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { uploadProfilePhotoService } from "@/services/admin.service";
import toast from "react-hot-toast";

const AdminProfile = () => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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

    if (!passwords.current) {
      errs.current = "Current password is required";
    }

    if (!passwords.new) {
      errs.new = "New password is required";
    } else if (passwords.new.length < 6) {
      errs.new = "Minimum 6 characters required";
    }

    if (!passwords.confirm) {
      errs.confirm = "Confirm your password";
    } else if (passwords.new !== passwords.confirm) {
      errs.confirm = "Passwords do not match";
    }

    setPassErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordChange = (field: string, value: string) => {
    const updated = value.replace(/^\s+/, ""); // no leading space

    setPasswords((prev) => ({
      ...prev,
      [field]: updated,
    }));

    setPassErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleChange = (field: string, value: string) => {
    let updated = value;

    if (field === "email") {
      updated = value.replace(/\s/g, "");
    } else if (field === "phone") {
      const hasPlus = value.startsWith("+");
      const digits = value.replace(/\D/g, "").slice(0, 15);
      updated = hasPlus ? `+${digits}` : digits;
    } else if (field === "name") {
      updated = value.replace(/^\s+/, "");
    }

    setProfile((prev) => ({
      ...prev,
      [field]: updated,
    }));
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) {
      toast.error("Please fill all password fields.");
      return;
    }

    try {

      const payload = {
        old_password: passwords.current,
        new_password: passwords.new,
      };

      await toast.promise(changePasswordService(payload), {
        loading: "Updating password...",
        success: "Password updated successfully.",
        error: (err) =>
          err?.response?.data?.message || "Failed to update password.",
      });

      // ✅ Reset fields
      setPasswords({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (err: any) {
      console.log("PASSWORD ERROR:", err?.response || err);

      const msg = err?.response?.data?.message || "Failed to update password";

      // ✅ Show API error in UI
      setPassErrors((prev) => ({
        ...prev,
        current: msg,
      }));
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();

      const user = res.data;

      setProfile({
        name: `${user.first_name || ""} ${user.last_name || ""}`,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "Admin",
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
        Admin Profile
      </h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-bold overflow-hidden">
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
              <button
                type="button"
                onClick={() =>
                  document.getElementById("profileUpload")?.click()
                }
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-accent text-foreground hover:bg-muted transition-colors"
              >
                <Camera size={14} />
              </button>
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
              {profile.name}
            </h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <Badge className="mt-2 bg-primary/10 text-primary border-0">
              <Shield size={12} className="mr-1" /> {profile.role}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              {profile.phone}
            </p>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label>
                  Role
                  <span className="text-red-500"> *</span>
                </Label>
                <Input value={profile.role} disabled className="bg-muted" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="relative"
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
              <Button variant="outline" onClick={fetchProfile}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activityLog.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
                  <Clock size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default AdminProfile;
