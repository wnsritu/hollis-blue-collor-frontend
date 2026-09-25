import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Shield } from "lucide-react";
import { getMyProfile } from "@/services/user.service";
import { updateProfile } from "@/services/admin";
import Spinner from "@/components/ui/spinner";
import { uploadProfilePhotoService } from "@/services/admin.service";
import toast from "react-hot-toast";
import { validateImageFile } from "@/validations/common/file";
import type { AdminProfileFormValues } from "@/types/admin.types";
import { adminProfileSchema } from "@/validations";

export const AdminProfile = () => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const [profileInfo, setProfileInfo] = useState({
    phone: "",
    role: "Admin",
  });

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    return {
      first_name: parts[0] || "",
      last_name: parts.slice(1).join(" ") || "",
    };
  };

  const formik = useFormik<AdminProfileFormValues>({
    initialValues: {
      name: "",
      email: "",
    },
    validationSchema: adminProfileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setProfileLoading(true);

        const { first_name, last_name } = splitName(values.name);

        const payload: any = {
          first_name,
          last_name,
          full_name: values.name.trim(),
          email: values.email.trim(),
        };

        await toast.promise(updateProfile(payload), {
          loading: "Updating profile...",
          success: "Profile updated successfully.",
          error: (err) =>
            err?.response?.data?.message || "Failed to update profile.",
        });

        await fetchProfile();
      } catch (err: any) {
        console.error("UPDATE ERROR:", err?.response || err);
      } finally {
        setProfileLoading(false);
      }
    },
  });

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      const user = res.data?.data || res.data || res;

      const roleName =
        typeof user.role === "string"
          ? user.role
          : user.role?.name || user.role_name || "Admin";

      setProfileInfo({
        phone: user.phone || "",
        role: roleName,
      });

      formik.setValues({
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.full_name || "Admin User",
        email: user.email || "",
      });

      if (user.profile_image || user.profile_photo || user.avatar) {
        const photoUrl = user.profile_image || user.profile_photo || user.avatar;
        setImage(photoUrl.startsWith("http") ? photoUrl : `${import.meta.env.VITE_API_BASE_URL || ""}${photoUrl}`);
      }
    } catch (err: any) {
      console.error("ADMIN PROFILE ERROR:", err);
      toast.error(err?.response?.data?.message || "Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    const validation = validateImageFile(file, { maxSizeBytes: 5 * 1024 * 1024 });
    if (!validation.valid) {
      toast.error(validation.error || "Image size must be 5MB or less.");
      return;
    }

    try {
      setProfileLoading(true);

      const preview = URL.createObjectURL(file);
      setImage(preview);

      const uploadPromise = uploadProfilePhotoService(file);

      const res = await toast.promise(uploadPromise, {
        loading: "Uploading image...",
        success: "Profile photo updated.",
        error: "Upload failed.",
      });

      if (res?.profile_photo) {
        setImage(`${import.meta.env.VITE_BASE_URL || ""}${res.profile_photo}`);
      }
      await fetchProfile();
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
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
                ) : formik.values.name ? (
                  formik.values.name
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
              {formik.values.name || "Admin"}
            </h2>
            <p className="text-sm text-muted-foreground">{formik.values.email}</p>
            <Badge className="mt-2 bg-primary/10 text-primary border-0">
              <Shield size={12} className="mr-1" /> {profileInfo.role}
            </Badge>
            {profileInfo.phone && (
              <p className="mt-3 text-sm text-muted-foreground">
                {profileInfo.phone}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="adminName">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminName"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Full name"
                    className={
                      formik.touched.name && formik.errors.name ? "border-red-500" : ""
                    }
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-xs text-red-500 min-h-[16px]">
                      {formik.errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminEmail"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.preventDefault();
                    }}
                    placeholder="admin@example.com"
                    className={
                      formik.touched.email && formik.errors.email ? "border-red-500" : ""
                    }
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-xs text-red-500 min-h-[16px]">
                      {formik.errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="relative"
                >
                  <span className={profileLoading ? "opacity-0" : "opacity-100"}>
                    Save Changes
                  </span>
                  {profileLoading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Spinner size={16} />
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void fetchProfile()}
                  disabled={profileLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;
