import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { authApi } from "@/services/auth";
import { customerApi, userApi } from "@/services/customer";
import { useAuthSession } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { getErrorMessage } from "@/lib/api/errors";
import type { CustomerProfileTab } from "@/types/customer.types";

function unwrapData<T = unknown>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return ((res as { data: T }).data ?? res) as T;
  }
  return res as T;
}

export function useCustomerProfile() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") as CustomerProfileTab) || "profile";
  const activeTab: CustomerProfileTab =
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

  const setTab = (tab: CustomerProfileTab) => {
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
        [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ") ||
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

      const primaryAddr =
        profile.address ||
        profile.addresses?.[0]?.address_line ||
        "";

      const primaryCity =
        profile.city ||
        profile.addresses?.[0]?.city ||
        "";

      const primaryState =
        profile.state ||
        profile.addresses?.[0]?.state ||
        "";

      const primaryZip =
        profile.zip_code ||
        profile.addresses?.[0]?.zip_code ||
        "";

      const primaryCountry =
        profile.country ||
        profile.addresses?.[0]?.country ||
        "";

      const primaryLat =
        profile.latitude ??
        profile.addresses?.[0]?.latitude ??
        null;

      const primaryLng =
        profile.longitude ??
        profile.addresses?.[0]?.longitude ??
        null;

      setAddress(primaryAddr);
      setCity(primaryCity);
      setState(primaryState);
      setZipCode(primaryZip);
      setCountry(primaryCountry);

      setLatitude(
        primaryLat !== null ? Number(primaryLat) : null
      );

      setLongitude(
        primaryLng !== null ? Number(primaryLng) : null
      );
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Failed to load profile.")
      );
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.full_name, user?.phone]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      toast.success("Profile photo uploaded.");

      try {
        await fetchMe();
      } catch {
        // Ignore fetchMe errors.
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Photo upload failed.")
      );
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      updateUser({ profile_photo: null, profile_image: null });
      await userApi.updateCustomerProfile({
        full_name: fullName.trim() || undefined,
        profile_photo: null,
        profile_image: null,
      });

      try {
        await customerApi.updateMyProfile({
          full_name: fullName.trim() || undefined,
          profile_photo: null,
          profile_image: null,
        });
      } catch {
        // Ignore fallback errors.
      }

      toast.success("Profile photo removed successfully.");

      try {
        await fetchMe();
      } catch {
        // Ignore fetchMe errors.
      }
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to remove profile photo."
        )
      );
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name is required.");
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

      await userApi.updateCustomerProfile(profilePayload);

      try {
        await customerApi.updateMyProfile(profilePayload);
      } catch {
        // Primary path already succeeded.
      }

      toast.success("Profile information saved successfully.");

      try {
        await fetchMe();
      } catch {
        // Ignore fetchMe errors.
      }

      await loadProfile();
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Failed to save profile."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (
    e?: React.FormEvent
  ) => {
    e?.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error(
        "New password must be at least 6 characters."
      );
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
      toast.error(
        getErrorMessage(
          err,
          "Failed to update password."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    activeTab,
    setTab,
    fileInputRef,
    loading,
    saving,
    fullName,
    setFullName,
    email,
    setEmail,
    mobileNumber,
    setMobileNumber,
    avatarPreview,
    status,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    zipCode,
    setZipCode,
    country,
    setCountry,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleImageChange,
    handleRemovePhoto,
    handleSaveProfile,
    handleUpdatePassword,
  };
}
