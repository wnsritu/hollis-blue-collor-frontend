import {
  Building2,
  HelpCircle,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  CheckCircle2,
} from "lucide-react";
import { sanitizePhoneInput } from "@/utils/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { parseGooglePlace } from "@/utils/googlePlaces";
import Spinner from "@/components/ui/spinner";
import { BANK_TYPE_OPTIONS } from "@/constants";
import { useProviderProfileSettings } from "@/hooks/useProviderProfileSettings";
import type { ProviderProfileTab } from "@/types/provider.types";
import type { BankAccountType } from "@/types/api/provider";




function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const ProviderProfileSettings = () => {
  const {
    activeTab,
    setTab,
    loading,
    saving,
    providerId,
    verified,
    rating,
    categories,
    planName,
    ownerName,
    setOwnerName,
    email,
    mobile,
    setMobile,
    businessName,
    setBusinessName,
    categoryId,
    setCategoryId,
    subcategoryId,
    setSubcategoryId,
    selectedServiceIds,
    setSelectedServiceIds,
    years,
    setYears,
    about,
    setAbout,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    zip,
    setZip,
    country,
    setCountry,
    lat,
    setLat,
    lng,
    setLng,
    licenseNumber,
    setLicenseNumber,
    insurancePolicy,
    setInsurancePolicy,
    certifications,
    setCertifications,
    logoPreview,
    handleLogoChange,
    bank,
    setBank,
    saveBank,
    faqs,
    faqModalOpen,
    setFaqModalOpen,
    editingFaq,
    faqForm,
    setFaqForm,
    handleOpenAddFaq,
    handleOpenEditFaq,
    handleSaveFaqLocal,
    handleDeleteFaq,
    saveFaqsOnly,
    selectedCategoryObj,
    availableSubcategories,
    selectedSubcategoryObj,
    availableServiceItems,
    categoryName,
    saveProfile,
  } = useProviderProfileSettings();



  if (loading) {
    return (
      <div className="container-grid flex min-h-[50vh] items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Business Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your business information, operating address, FAQs and
            deposit bank account.
          </p>
        </div>
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as ProfileTab)}
        >
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-3">
            <TabsTrigger value="info" className="gap-2 py-2">
              <Building2 size={16} /> Business Info
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2 py-2">
              <Landmark size={16} /> Bank Account Details
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-2 py-2">
              <HelpCircle size={16} /> FAQs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* ── Business Info ── */}
          {activeTab === "info" && (
            <>
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <User size={18} className="text-primary" /> Primary Account
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerName">Full Name</Label>
                      <Input
                        id="ownerName"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pemail">Email Address</Label>
                      <Input id="pemail" type="email" value={email} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pmobile">Mobile Number</Label>
                      <Input
                        id="pmobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(sanitizePhoneInput(e.target.value))}
                        placeholder="(512) 555-0148"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Building2 size={18} className="text-primary" /> Business
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="bn">Business Name</Label>
                      <Input
                        id="bn"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1.5">
                        Primary Category <span className="text-[10px] text-muted-foreground font-normal">(Fixed at registration)</span>
                      </Label>
                      <Input
                        value={selectedCategoryObj?.name || "Home Services"}
                        disabled
                        className="bg-muted/50 text-muted-foreground font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1.5">
                        Subcategory <span className="text-[10px] text-muted-foreground font-normal">(Fixed at registration)</span>
                      </Label>
                      <Input
                        value={selectedSubcategoryObj?.name || "Plumbing"}
                        disabled
                        className="bg-muted/50 text-muted-foreground font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="years">Years of Experience</Label>
                      <Input
                        id="years"
                        type="number"
                        min={0}
                        placeholder="e.g. 14"
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                      />
                    </div>
                  </div>


                  <div className="grid gap-2">
                    <Label htmlFor="ab">About Your Business</Label>
                    <Textarea
                      id="ab"
                      rows={5}
                      placeholder="Describe your services, experience, and why customers should choose your business..."
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <MapPin size={18} className="text-primary" /> Operating
                    Address &amp; Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <GooglePlaceAutocomplete
                        value={address}
                        onChange={setAddress}
                        placeholder="Enter street address..."
                        onSelect={(place) => {
                          const parsed = parseGooglePlace(place);
                          setAddress(parsed.address);
                          setLat(parsed.lat);
                          setLng(parsed.lng);
                          if (parsed.city) setCity(parsed.city);
                          if (parsed.state) setState(parsed.state);
                          if (parsed.zip) setZip(parsed.zip);
                          if (parsed.country) setCountry(parsed.country);
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input
                        id="zip"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <ShieldCheck size={18} className="text-primary" /> Verified
                    Credentials &amp; Licensing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="lic">License Number</Label>
                      <Input
                        id="lic"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ins">Insurance Policy Number</Label>
                      <Input
                        id="ins"
                        value={insurancePolicy}
                        onChange={(e) => setInsurancePolicy(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="certs">
                      Certifications (comma separated)
                    </Label>
                    <Input
                      id="certs"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="EPA Certified, Master Plumber, …"
                    />
                  </div>
                  <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Document uploads are verified by Admin during onboarding
                    review. Use verification docs upload during onboarding if
                    needed.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── FAQs ── */}
          {activeTab === "faqs" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Manage FAQs displayed on your public provider profile.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={saveFaqsOnly}
                    disabled={saving}
                  >
                    Save FAQs
                  </Button>
                  <Button onClick={handleOpenAddFaq} className="gap-1.5 shrink-0">
                    <Plus size={16} /> Add FAQ
                  </Button>
                </div>
              </div>

              {faqs.length === 0 ? (
                <Card className="p-8 text-center">
                  <HelpCircle
                    size={32}
                    className="mx-auto mb-2 text-muted-foreground opacity-50"
                  />
                  <h3 className="font-bold text-foreground">
                    No FAQs added yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Click &apos;+ Add FAQ&apos; above to create answers to common
                    customer questions.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <Card key={faq.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                              <HelpCircle
                                size={17}
                                className="shrink-0 text-primary"
                              />
                              {faq.question}
                            </h3>
                            <p className="pl-6 text-sm leading-relaxed text-muted-foreground">
                              {faq.answer}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditFaq(faq)}
                              className="gap-1 text-xs"
                            >
                              <Pencil size={14} /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="gap-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} /> Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Bank ── */}
          {activeTab === "bank" && (
            <Card>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Landmark size={18} className="text-primary" /> Bank
                  Information &amp; Payout Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bankname">Bank Name</Label>
                    <Input
                      id="bankname"
                      placeholder="e.g. Chase Bank"
                      value={bank.bank_name}
                      onChange={(e) =>
                        setBank((b) => ({ ...b, bank_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="holder">Account Holder Name</Label>
                    <Input
                      id="holder"
                      placeholder="e.g. ABC Plumbing LLC"
                      value={bank.bank_account_holder}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          bank_account_holder: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account">Account Number</Label>
                    <Input
                      id="account"
                      placeholder="Enter account number (digits only)"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={bank.bank_account_number}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          bank_account_number: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="routing">Routing Number / IFSC</Label>
                    <Input
                      id="routing"
                      placeholder="Enter routing number or IFSC"
                      value={bank.bank_routing_number}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          bank_routing_number: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="btype">Account Type</Label>
                    <Select
                      value={bank.bank_account_type}
                      onValueChange={(v) =>
                        setBank((b) => ({
                          ...b,
                          bank_account_type: v as BankAccountType,
                        }))
                      }
                    >
                      <SelectTrigger id="btype">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={saveBank} disabled={saving}>
                    {saving ? "Saving…" : "Save Bank Details"}
                  </Button>
                </div>

                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Deposit account details remain strictly private to your
                  provider account and are used for payout releases.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Upload size={18} className="text-primary" /> Business Logo
                Uploader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 text-center">
              <div className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/30">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                    {initialsFrom(businessName)}
                  </div>
                )}
              </div>
              <div>
                <Label
                  htmlFor="logo_upload"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Upload size={14} /> {logoPreview ? "Change Logo" : "Upload New Logo"}
                </Label>
                <input
                  id="logo_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  PNG, JPG or SVG logo image (Max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initialsFrom(businessName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">
                    {businessName || "Your Business"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryName || "Category"}
                  </p>
                </div>
              </div>

              {verified === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} /> Verified
                </span>
              )}

              <Separator />

              <dl className="space-y-2.5 text-xs">
                {rating != null && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Rating</dt>
                    <dd className="font-bold text-foreground">
                      {rating.toFixed(1)} ★
                    </dd>
                  </div>
                )}
                {years !== "" && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Years in Business</dt>
                    <dd className="font-semibold text-foreground">
                      {years} Years
                    </dd>
                  </div>
                )}
                {(city || state) && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-semibold text-foreground">
                      {[city, state].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )}
                {planName && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="font-semibold text-foreground">{planName}</dd>
                  </div>
                )}
              </dl>

              <Separator />

              <Button
                onClick={
                  activeTab === "bank"
                    ? saveBank
                    : activeTab === "faqs"
                      ? saveFaqsOnly
                      : saveProfile
                }
                className="w-full"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save All Changes"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <HelpCircle size={18} className="text-primary" />
              {editingFaq ? "Edit FAQ" : "Add Frequently Asked Question"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingFaq
                ? "Update your existing FAQ entry for potential customers."
                : "Add a new question and answer to display on your public business profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="faq_question" className="text-xs font-bold">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="faq_question"
                placeholder="e.g. Do you provide same-day service?"
                value={faqForm.question}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, question: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq_answer" className="text-xs font-bold">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="faq_answer"
                rows={4}
                placeholder="Enter the answer to this question..."
                value={faqForm.answer}
                onChange={(e) =>
                  setFaqForm({ ...faqForm, answer: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-2">
            <Button variant="outline" onClick={() => setFaqModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFaqLocal}>
              {editingFaq ? "Save Changes" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfileSettings;
