import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Camera,
  Eye,
  EyeOff,
  Lock,
  MapPin,
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
import { sanitizePhoneInput } from "@/utils/format";
import Spinner from "@/components/ui/spinner";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { cn } from "@/lib/utils";

import { authApi } from "@/api/modules/auth.api";
import { customerApi } from "@/api/modules/customer.api";
import { userApi } from "@/api/modules/user.api";
import { useAuthSession } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getErrorMessage } from "@/lib/api/errors";
import { extractApiFieldErrors } from "@/utils/providerValidation";

type ProfileTab = "profile" | "security";

interface FieldErrors {
  fullName?: string;
  mobileNumber?: string;
  zipCode?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function unwrapData<T = unknown>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return ((res as { data: T }).data ?? res) as T;
  }
  return res as T;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CU";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const CustomerProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as ProfileTab) || "profile";
  const activeTab: ProfileTab =
    tabParam === "security" ? "security" : "profile";

  const { user, fetchMe, updateUser } = useAuthSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("active");

  // Address fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Input Field Validation Errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const setTab = (tab: ProfileTab) => {
    setFieldErrors({});
    setSearchParams(tab === "profile" ? {} : { tab });
  };

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    let err: string | undefined;
    if (!val.trim()) {
      err = "Full name is required.";
    } else if (val.trim().length < 2) {
      err = "Full name must be at least 2 characters.";
    }
    setFieldErrors((prev) => ({ ...prev, fullName: err }));
  };

  const handleMobileNumberChange = (val: string) => {
    const sanitized = sanitizePhoneInput(val);
    setMobileNumber(sanitized);
    let err: string | undefined;
    if (sanitized.trim()) {
      const digits = sanitized.replace(/\D/g, "");
      if (digits.length < 10) {
        err = "Phone number must be at least 10 digits.";
      }
    }
    setFieldErrors((prev) => ({ ...prev, mobileNumber: err }));
  };

  const handleZipCodeChange = (val: string) => {
    setZipCode(val);
    let err: string | undefined;
    if (val.trim() && val.trim().length < 3) {
      err = "Please enter a valid postal code.";
    }
    setFieldErrors((prev) => ({ ...prev, zipCode: err }));
  };

  const handleCurrentPasswordChange = (val: string) => {
    setCurrentPassword(val);
    let err: string | undefined;
    if (!val) {
      err = "Please enter your current password.";
    }
    setFieldErrors((prev) => ({ ...prev, currentPassword: err }));
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    let err: string | undefined;
    if (!val) {
      err = "New password is required.";
    } else if (val.length < 6) {
      err = "New password must be at least 6 characters.";
    }
    setFieldErrors((prev) => ({ ...prev, newPassword: err }));

    if (confirmPassword) {
      const cErr = val !== confirmPassword ? "New passwords do not match." : undefined;
      setFieldErrors((prev) => ({ ...prev, confirmPassword: cErr }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    let err: string | undefined;
    if (!val) {
      err = "Please confirm your new password.";
    } else if (newPassword !== val) {
      err = "New passwords do not match.";
    }
    setFieldErrors((prev) => ({ ...prev, confirmPassword: err }));
  };

  const validateProfileForm = (): boolean => {
    const errs: FieldErrors = {};
    if (!fullName.trim()) {
      errs.fullName = "Full name is required.";
    } else if (fullName.trim().length < 2) {
      errs.fullName = "Full name must be at least 2 characters.";
    }

    if (mobileNumber.trim()) {
      const digits = mobileNumber.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        errs.mobileNumber = "Phone number must be 10 to 15 digits.";
      }
    }

    if (zipCode.trim() && zipCode.trim().length < 3) {
      errs.zipCode = "Please enter a valid postal code.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const errs: FieldErrors = {};
    if (!currentPassword) {
      errs.currentPassword = "Please enter your current password.";
    }
    if (!newPassword) {
      errs.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      errs.newPassword = "New password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "New passwords do not match.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
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
      } else {
        setAvatarPreview(null);
      }

      // Populate address details
      const primaryAddr =
        profile.address || profile.addresses?.[0]?.address_line || "";
      const primaryCity = profile.city || profile.addresses?.[0]?.city || "";
      const primaryState = profile.state || profile.addresses?.[0]?.state || "";
      const primaryZip = profile.zip_code || profile.addresses?.[0]?.zip_code || "";
      const primaryCountry = profile.country || profile.addresses?.[0]?.country || "";
      const primaryLat = profile.latitude ?? profile.addresses?.[0]?.latitude ?? null;
      const primaryLng = profile.longitude ?? profile.addresses?.[0]?.longitude ?? null;

      setAddress(primaryAddr);
      setCity(primaryCity);
      setState(primaryState);
      setZipCode(primaryZip);
      setCountry(primaryCountry);
      setLatitude(primaryLat !== null ? Number(primaryLat) : null);
      setLongitude(primaryLng !== null ? Number(primaryLng) : null);
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

      const res: any = await userApi.updateProfilePhoto(formData);
      const newPhotoPath =
        res?.profile_photo ||
        res?.profile_image ||
        res?.data?.profile_photo ||
        res?.data?.profile_image;
      if (newPhotoPath) {
        updateUser({ profile_image: newPhotoPath, profile_photo: newPhotoPath });
      }
      toast.success("Profile photo uploaded successfully.");

      try {
        await fetchMe();
      } catch {
        /* non-blocking */
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Photo upload failed."));
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      updateUser({ profile_photo: null, profile_image: null });

      try {
        await userApi.updateCustomerProfile({
          full_name: fullName.trim() || undefined,
          profile_photo: null,
          profile_image: null,
        });
      } catch {
        await customerApi.updateMyProfile({
          full_name: fullName.trim() || undefined,
          profile_photo: null,
          profile_image: null,
        });
      }

      toast.success("Profile photo removed successfully.");
      try {
        await fetchMe();
      } catch {
        /* non-blocking */
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove profile photo."));
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    try {
      setSaving(true);
      const profilePayload = {
        full_name: fullName.trim(),
        phone: mobileNumber.trim() || undefined,
        address: address.trim() || undefined,
        address_line: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      };

      try {
        await userApi.updateCustomerProfile(profilePayload);
      } catch {
        await customerApi.updateMyProfile(profilePayload);
      }

      updateUser({
        full_name: fullName.trim(),
        phone: mobileNumber.trim(),
      });

      toast.success("Profile information saved successfully.");
      try {
        await fetchMe();
      } catch {
        /* non-blocking */
      }
      await loadProfile();
    } catch (err: any) {
      const apiErrs = extractApiFieldErrors(err);
      if (Object.keys(apiErrs).length > 0) {
        setFieldErrors(apiErrs);
      }
      toast.error(getErrorMessage(err, "Failed to save profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validatePasswordForm()) {
      toast.error("Please fix password validation errors.");
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
      setFieldErrors({});
    } catch (err: any) {
      const apiErrs = extractApiFieldErrors(err);
      if (Object.keys(apiErrs).length > 0) {
        setFieldErrors(apiErrs);
      }
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
            Manage your personal details, address, and password security.
          </p>
        </div>

        {activeTab === "profile" ? (
          <Button type="button" onClick={(e) => handleSaveProfile(e)} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        ) : (
          <Button type="button" onClick={(e) => handleUpdatePassword(e)} disabled={saving}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as ProfileTab)}>
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile" className="gap-2 py-2">
              <User size={16} />
              Profile
            </TabsTrigger>

            <TabsTrigger value="security" className="gap-2 py-2">
              <Lock size={16} />
              Password &amp; Security
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {activeTab === "profile" && (
            <>
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Update your contact details used for service bookings and communications.
                  </p>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Profile Photo */}
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
                            <Avatar initials={initialsFrom(fullName)} size="lg" />
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
                              <Camera size={13} />
                              Change Photo
                            </Button>

                            {avatarPreview && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                                onClick={handleRemovePhoto}
                              >
                                <Trash2 size={13} />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        onBlur={() => handleFullNameChange(fullName)}
                        placeholder="e.g. John Smith"
                        className={cn(
                          fieldErrors.fullName &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={email} readOnly className="bg-muted/50" />
                    </div>

                    {/* Mobile Number */}
                    <div className="grid gap-2">
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => handleMobileNumberChange(e.target.value)}
                        onBlur={() => handleMobileNumberChange(mobileNumber)}
                        placeholder="e.g. (555) 234-5678"
                        className={cn(
                          fieldErrors.mobileNumber &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.mobileNumber && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.mobileNumber}
                        </p>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Address & Location */}
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <MapPin size={18} className="text-primary" />
                    Address &amp; Location
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Street Address */}
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <GooglePlaceAutocomplete
                        value={address}
                        onChange={setAddress}
                        placeholder="Enter street address..."
                        onSelect={(place) => {
                          setAddress(place.address);
                          setLatitude(place.lat);
                          setLongitude(place.lng);

                          const comps = place.fullPlace?.address_components || [];
                          const getComp = (type: string) =>
                            comps.find((c) => c.types.includes(type))?.long_name || "";

                          const cityVal = getComp("locality") || getComp("sublocality") || city;
                          const stateVal = getComp("administrative_area_level_1") || state;
                          const zipVal = getComp("postal_code") || zipCode;
                          const countryVal = getComp("country") || country;

                          if (cityVal) setCity(cityVal);
                          if (stateVal) setState(stateVal);
                          if (zipVal) setZipCode(zipVal);
                          if (countryVal) setCountry(countryVal);
                        }}
                      />
                    </div>

                    {/* City */}
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. New York"
                      />
                    </div>

                    {/* State */}
                    <div className="grid gap-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. NY"
                      />
                    </div>

                    {/* ZIP */}
                    <div className="grid gap-2">
                      <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => handleZipCodeChange(e.target.value)}
                        onBlur={() => handleZipCodeChange(zipCode)}
                        placeholder="e.g. 10001"
                        className={cn(
                          fieldErrors.zipCode &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.zipCode && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.zipCode}
                        </p>
                      )}
                    </div>

                    {/* Country */}
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. USA"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="button" onClick={(e) => handleSaveProfile(e)} disabled={saving}>
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Password Reset &amp; Security</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your account password to maintain strong account security.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  {/* Current Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                        onBlur={() => handleCurrentPasswordChange(currentPassword)}
                        placeholder="••••••••"
                        className={cn(
                          "pr-10",
                          fieldErrors.currentPassword &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.currentPassword && (
                      <p className="text-xs font-medium text-destructive">
                        {fieldErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => handleNewPasswordChange(e.target.value)}
                        onBlur={() => handleNewPasswordChange(newPassword)}
                        placeholder="••••••••"
                        className={cn(
                          "pr-10",
                          fieldErrors.newPassword &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <p className="text-xs font-medium text-destructive">
                        {fieldErrors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        onBlur={() => handleConfirmPasswordChange(confirmPassword)}
                        placeholder="••••••••"
                        className={cn(
                          "pr-10",
                          fieldErrors.confirmPassword &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs font-medium text-destructive">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
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

        {/* Profile Summary */}
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

              <CardTitle className="text-base">{fullName || "Customer"}</CardTitle>
              <p className="text-xs text-muted-foreground">{email}</p>
            </CardHeader>

            <CardContent className="space-y-4 pt-2 text-xs">
              <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
                {/* Account Type */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-semibold text-foreground">Customer</span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <ShieldCheck size={13} />
                    {status === "inactive" ? "Inactive" : "Active"}
                  </span>
                </div>

                {/* Mobile */}
                {mobileNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mobile</span>
                    <span className="font-semibold text-foreground">{mobileNumber}</span>
                  </div>
                )}

                {/* Address */}
                {address && (
                  <div className="flex items-start justify-between gap-2 border-t border-border pt-2">
                    <span className="shrink-0 text-muted-foreground">Address</span>
                    <span className="text-right font-medium text-foreground">
                      {[address, city, state, zipCode].filter(Boolean).join(", ")}
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
