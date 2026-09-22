import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff, Lock, Sliders, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/primitives";
import { changePasswordService } from "@/services/auth.service";
import { getPlatformSettings, updatePlatformSettings } from "@/services/admin";
import type { PlatformGeneralSettings } from "@/types/admin.types";
import {
  platformGeneralSettingsSchema,
  adminPasswordChangeSchema,
} from "@/validations";

const defaultGeneral: PlatformGeneralSettings = {
  name: "Hollis",
  tagline: "Hollis — Blue Collar Worker",
  support: "support@Hollis.com",
  phone: "8005550142",
  address: "600 Congress Ave, Austin, TX 78701",
};

export function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: "general" | "security" = rawTab === "security" ? "security" : "general";

  const [loadingGeneral, setLoadingGeneral] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Password Visibility Toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Formik for General Settings
  const generalFormik = useFormik<PlatformGeneralSettings>({
    initialValues: defaultGeneral,
    validationSchema: platformGeneralSettingsSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setSavingGeneral(true);
        const payload = {
          platform_name: values.name.trim(),
          tagline: values.tagline.trim(),
          support_email: values.support.trim(),
          support_phone: values.phone.trim(),
          business_address: values.address.trim(),
        };

        await toast.promise(updatePlatformSettings(payload), {
          loading: "Saving platform settings...",
          success: "Platform settings updated successfully.",
          error: (err: any) =>
            err?.response?.data?.message || err?.message || "Failed to update settings.",
        });
      } catch (err: any) {
        console.error("Failed to save settings:", err);
      } finally {
        setSavingGeneral(false);
      }
    },
  });

  // Formik for Password & Security
  const securityFormik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: adminPasswordChangeSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setPasswordLoading(true);
        const payload = {
          old_password: values.currentPassword,
          new_password: values.newPassword,
        };

        await toast.promise(changePasswordService(payload), {
          loading: "Updating password...",
          success: "Password updated successfully.",
          error: (err: any) =>
            err?.response?.data?.message || err?.message || "Failed to update password.",
        });

        resetForm();
      } catch (err: any) {
        console.error("Password update error:", err);
      } finally {
        setPasswordLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingGeneral(true);
        const res: any = await getPlatformSettings();
        const data = res?.data?.data || res?.data || res;
        if (data) {
          const rawPhone = String(data.support_phone || defaultGeneral.phone).replace(/\D/g, "").slice(0, 10);
          generalFormik.setValues({
            name: data.platform_name || defaultGeneral.name,
            tagline: data.tagline ?? defaultGeneral.tagline,
            support: data.support_email || defaultGeneral.support,
            phone: rawPhone,
            address: data.business_address ?? defaultGeneral.address,
          });
        }
      } catch (err: any) {
        console.error("Failed to load platform settings:", err);
      } finally {
        setLoadingGeneral(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleTabChange = (nextTab: string) => {
    const tabKey = nextTab === "security" ? "security" : "general";
    setSearchParams({ tab: tabKey }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        subtitle="Global configuration and account security for Hollis Admin."
        action={
          activeTab === "general" ? (
            <Button
              type="button"
              onClick={() => generalFormik.handleSubmit()}
              disabled={savingGeneral || loadingGeneral}
            >
              {savingGeneral ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => securityFormik.handleSubmit()}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          )
        }
      />

      {/* TABS NAVIGATION */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="general" className="gap-2">
              <Sliders size={16} /> General Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock size={16} /> Password & Security
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "general" && (
        <form onSubmit={generalFormik.handleSubmit} noValidate>
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:grid-cols-2">
            {/* Platform name */}
            <div className="grid gap-2">
              <Label htmlFor="pname">Platform name</Label>
              <Input
                id="pname"
                name="name"
                readOnly
                value={generalFormik.values.name}
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Tagline */}
            <div className="grid gap-2">
              <Label htmlFor="ptag">Tagline</Label>
              <Input
                id="ptag"
                name="tagline"
                readOnly
                value={generalFormik.values.tagline}
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Support email */}
            <div className="grid gap-2">
              <Label htmlFor="psup">
                Support email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="psup"
                name="support"
                type="email"
                value={generalFormik.values.support}
                onChange={generalFormik.handleChange}
                onBlur={generalFormik.handleBlur}
                placeholder="support@hollis.com"
                disabled={loadingGeneral}
                className={
                  generalFormik.touched.support && generalFormik.errors.support
                    ? "border-red-500"
                    : ""
                }
              />
              {generalFormik.touched.support && generalFormik.errors.support && (
                <p className="text-xs text-red-500">{generalFormik.errors.support}</p>
              )}
            </div>

            {/* Support phone */}
            <div className="grid gap-2">
              <Label htmlFor="pph">
                Support phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pph"
                name="phone"
                maxLength={10}
                value={generalFormik.values.phone}
                onChange={(e) => {
                  // Only allow numbers and limit strictly to 10 digits
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  generalFormik.setFieldValue("phone", digits);
                }}
                onBlur={generalFormik.handleBlur}
                placeholder="10-digit phone number"
                disabled={loadingGeneral}
                className={
                  generalFormik.touched.phone && generalFormik.errors.phone
                    ? "border-red-500"
                    : ""
                }
              />
              {generalFormik.touched.phone && generalFormik.errors.phone ? (
                <p className="text-xs text-red-500">{generalFormik.errors.phone}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Enter 10-digit numeric phone number</p>
              )}
            </div>

            {/* Business address */}
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="padd">Business address</Label>
              <Textarea
                id="padd"
                name="address"
                rows={2}
                value={generalFormik.values.address}
                onChange={generalFormik.handleChange}
                onBlur={generalFormik.handleBlur}
                placeholder="Business address"
                disabled={loadingGeneral}
              />
            </div>
          </section>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={savingGeneral || loadingGeneral}
            >
              {savingGeneral ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      )}

      {activeTab === "security" && (
        <Card className="shadow-card max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Password Reset & Security</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your administrator account password to maintain strong security.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={securityFormik.handleSubmit} className="space-y-5" noValidate>
              {/* Current Password */}
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={securityFormik.values.currentPassword}
                    onChange={securityFormik.handleChange}
                    onBlur={securityFormik.handleBlur}
                    className={
                      securityFormik.touched.currentPassword && securityFormik.errors.currentPassword
                        ? "border-red-500 pr-10"
                        : "pr-10"
                    }
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {securityFormik.touched.currentPassword && securityFormik.errors.currentPassword && (
                  <p className="text-xs text-red-500">{securityFormik.errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="grid gap-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={securityFormik.values.newPassword}
                    onChange={securityFormik.handleChange}
                    onBlur={securityFormik.handleBlur}
                    className={
                      securityFormik.touched.newPassword && securityFormik.errors.newPassword
                        ? "border-red-500 pr-10"
                        : "pr-10"
                    }
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {securityFormik.touched.newPassword && securityFormik.errors.newPassword && (
                  <p className="text-xs text-red-500">{securityFormik.errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  Confirm New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={securityFormik.values.confirmPassword}
                    onChange={securityFormik.handleChange}
                    onBlur={securityFormik.handleBlur}
                    className={
                      securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword
                        ? "border-red-500 pr-10"
                        : "pr-10"
                    }
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword && (
                  <p className="text-xs text-red-500">{securityFormik.errors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminSettings;
