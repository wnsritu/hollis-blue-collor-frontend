import React, { useState } from "react";
import { Eye, EyeOff, Lock, Sliders } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/primitives";

const BRAND = {
  name: "Hollis",
  tagline: "Hollis — Blue Collar Worker",
};

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  const [general, setGeneral] = useState({
    name: BRAND.name,
    tagline: BRAND.tagline,
    support: "support@Hollis.com",
    phone: "(800) 555-0142",
    address: "600 Congress Ave, Austin, TX 78701",
  });

  // Password Reset State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const save = () => toast.success("Settings saved");

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    toast.success("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        subtitle="Global configuration and account security for Hollis Admin."
        action={
          activeTab === "general" ? (
            <Button onClick={save}>Save changes</Button>
          ) : (
            <Button onClick={handleUpdatePassword}>Update Password</Button>
          )
        }
      />

      {/* TABS NAVIGATION */}
      <div className="mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "general" | "security");
          }}
        >
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
        <>
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pname">Platform name</Label>
              <Input id="pname" value={general.name} onChange={(e) => setGeneral({ ...general, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ptag">Tagline</Label>
              <Input id="ptag" value={general.tagline} onChange={(e) => setGeneral({ ...general, tagline: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="psup">Support email</Label>
              <Input id="psup" value={general.support} onChange={(e) => setGeneral({ ...general, support: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pph">Support phone</Label>
              <Input id="pph" value={general.phone} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="padd">Business address</Label>
              <Textarea id="padd" rows={2} value={general.address} onChange={(e) => setGeneral({ ...general, address: e.target.value })} />
            </div>
          </section>

          <div className="mt-6 flex justify-end">
            <Button onClick={save}>Save changes</Button>
          </div>
        </>
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
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit">Update Password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSettings;
