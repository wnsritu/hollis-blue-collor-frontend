import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Camera,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/shared/primitives";
import Spinner from "@/components/ui/spinner";

import { authApi } from "@/api/modules/auth.api";
import { customerApi } from "@/api/modules/customer.api";
import { userApi } from "@/api/modules/user.api";
import { useAuthSession } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getErrorMessage } from "@/lib/api/errors";

type ProfileTab = "profile" | "security";

function unwrapData<T = unknown>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return ((res as { data: T }).data ?? res) as T;
  }
  return res as T;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const CustomerProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as ProfileTab) || "profile";
  const activeTab: ProfileTab =
    tabParam === "security" ? "security" : "profile";

  const { user, fetchMe } = useAuthSession();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("active");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setTab = (tab: ProfileTab) => {
    setSearchParams(tab === "profile" ? {} : { tab });
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      let profile: any = null;

      try {
        profile = unwrapData(await customerApi.getMyProfile());
      } catch {
        profile = unwrapData(await userApi.getMyProfile());
      }

      if (!profile) {
        toast.error("Could not load profile.");
        return;
      }

      const name =
        profile.full_name ||
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        user?.full_name ||
        "";
      setFullName(name);
      setEmail(profile.email || user?.email || "");
      setMobileNumber(profile.phone || user?.phone || "");
      setStatus(String(profile.status || "active"));

      const photo = profile.profile_image || profile.profile_photo;
      if (photo) {
        setAvatarPreview(resolveMediaUrl(String(photo)));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.full_name, user?.phone]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    try {
      setAvatarPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("profile_photo", file);
      await userApi.updateProfilePhoto(formData);
      toast.success("Profile photo uploaded.");
      try {
        await fetchMe();
      } catch {
        /* ignore */
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Photo upload failed."));
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Photo cleared locally. Upload a new one to replace.");
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    try {
      setSaving(true);
      await customerApi.updateMyProfile({
        full_name: fullName.trim(),
        phone: mobileNumber.trim() || undefined,
      });
      // Also update legacy customer profile path for address-compatible clients
      try {
        await userApi.updateCustomerProfile({
          full_name: fullName.trim(),
          phone: mobileNumber.trim() || undefined,
        });
      } catch {
        /* primary path already succeeded */
      }
      toast.success("Profile information saved successfully.");
      try {
        await fetchMe();
      } catch {
        /* ignore */
      }
      await loadProfile();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await authApi.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update password."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your personal details and password security.
          </p>
        </div>
        {activeTab === "profile" ? (
          <Button onClick={() => handleSaveProfile()} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        ) : (
          <Button onClick={() => handleUpdatePassword()} disabled={saving}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as ProfileTab)}
        >
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile" className="gap-2 py-2">
              <User size={16} /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 py-2">
              <Lock size={16} /> Password &amp; Security
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your contact details used for service bookings and
                  communications.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <div className="relative">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt={fullName}
                            className="size-16 rounded-full object-cover"
                          />
                        ) : (
                          <Avatar
                            initials={initialsFrom(fullName)}
                            size="lg"
                          />
                        )}
                      </div>
                      <div className="space-y-2 text-center sm:text-left">
                        <p className="text-sm font-bold text-foreground">
                          Profile Photo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="avatar-upload-input"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera size={13} /> Change Photo
                          </Button>
                          {avatarPreview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                              onClick={handleRemovePhoto}
                            >
                              <Trash2 size={13} /> Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Smith"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. (555) 234-5678"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Password Reset &amp; Security
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your account password to maintain strong account
                  security.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Updating…" : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto mb-3 flex justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Customer Avatar"
                    className="size-20 rounded-full border-2 border-primary/20 object-cover"
                  />
                ) : (
                  <Avatar initials={initialsFrom(fullName)} size="lg" />
                )}
              </div>
              <CardTitle className="text-base">
                {fullName || "Customer"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{email}</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-xs">
              <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-semibold text-foreground">Customer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <ShieldCheck size={13} />{" "}
                    {status === "inactive" ? "Inactive" : "Active"}
                  </span>
                </div>
                {mobileNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mobile</span>
                    <span className="font-semibold text-foreground">
                      {mobileNumber}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default CustomerProfile;
