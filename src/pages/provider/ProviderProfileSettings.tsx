import { useMemo } from "react";
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
  AlertCircle,
} from "lucide-react";
import { sanitizePhoneInput } from "@/utils/format";
import { cn } from "@/lib/utils";

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
    savedOwnerName,
    savedBusinessName,
    fieldErrors,
    setFieldErrors,
    handleOwnerNameChange,
    handleBusinessNameChange,
    handleAboutChange,
    handleMobileChange,
    handleYearsChange,
    handleZipChange,
    handleAddressChange,
    handleCityChange,
    handleStateChange,
    handleCountryChange,
    handleLicenseNumberChange,
    handleInsurancePolicyChange,
    handleBankFieldChange,
  } = useProviderProfileSettings();

  const startingPrice = useMemo(() => {
    if (availableServiceItems && availableServiceItems.length > 0) {
      const prices = availableServiceItems
        .map((s: any) => Number(s.base_price || s.price || s.hourly_rate))
        .filter((p: number) => !isNaN(p) && p > 0);
      if (prices.length > 0) return Math.min(...prices);
    }
    return 120;
  }, [availableServiceItems]);

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
            Manage your business information, operating address, FAQs and deposit bank account.
          </p>
        </div>
        <Button type="button" onClick={(e) => saveProfile(e)} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as ProviderProfileTab)}>
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
              {/* {Object.values(fieldErrors).some(Boolean) && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-bold text-base">Please fix the following validation errors:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
                        {Object.entries(fieldErrors)
                          .filter(([, msg]) => Boolean(msg))
                          .map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )} */}
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <User size={18} className="text-primary" /> Primary Account Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="ownerName">
                        Full Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="ownerName"
                        value={ownerName}
                        onChange={(e) => handleOwnerNameChange(e.target.value)}
                        onBlur={() => handleOwnerNameChange(ownerName)}
                        placeholder="John Doe"
                        className={cn(
                          fieldErrors.ownerName && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.ownerName && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.ownerName}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pemail">Email Address</Label>
                      <Input id="pemail" type="email" value={email} readOnly className="bg-muted/50" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pmobile">Mobile Number</Label>
                      <Input
                        id="pmobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        onBlur={() => handleMobileChange(mobile)}
                        placeholder="(512) 555-0148"
                        className={cn(
                          fieldErrors.mobile && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.mobile && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.mobile}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Building2 size={18} className="text-primary" /> Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="bn">
                        Business Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="bn"
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        onBlur={() => handleBusinessNameChange(businessName)}
                        className={cn(
                          fieldErrors.businessName && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.businessName && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.businessName}</p>
                      )}
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
                        onChange={(e) => handleYearsChange(e.target.value)}
                        onBlur={() => handleYearsChange(years)}
                        className={cn(
                          fieldErrors.years && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.years && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.years}</p>
                      )}
                    </div>
                  </div>


                  <div className="grid gap-2">
                    <Label htmlFor="ab">
                      About Your Business <span className="text-destructive font-bold ml-0.5">*</span>
                    </Label>
                    <Textarea
                      id="ab"
                      rows={5}
                      placeholder="Describe your services, experience, and why customers should choose your business..."
                      value={about}
                      onChange={(e) => handleAboutChange(e.target.value)}
                      onBlur={() => handleAboutChange(about)}
                      className={cn(
                        fieldErrors.about && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {fieldErrors.about && (
                      <p className="text-xs font-medium text-destructive">{fieldErrors.about}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <MapPin size={18} className="text-primary" /> Operating Address &amp; Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="address">
                        Street Address <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <GooglePlaceAutocomplete
                        value={address}
                        onChange={(val) => handleAddressChange(val)}
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
                      {fieldErrors.address && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.address}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        onBlur={() => handleCityChange(city)}
                        className={cn(
                          fieldErrors.city && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.city && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.city}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">
                        State / Province <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        onBlur={() => handleStateChange(state)}
                        className={cn(
                          fieldErrors.state && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.state && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.state}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zip">ZIP / Postal Code</Label>
                      <Input
                        id="zip"
                        value={zip}
                        onChange={(e) => handleZipChange(e.target.value)}
                        onBlur={() => handleZipChange(zip)}
                        className={cn(
                          fieldErrors.zip && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.zip && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.zip}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">
                        Country <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        onBlur={() => handleCountryChange(country)}
                        className={cn(
                          fieldErrors.country && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.country && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.country}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <ShieldCheck size={18} className="text-primary" /> Verified Credentials &amp; Licensing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="lic">
                        License Number <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="lic"
                        value={licenseNumber}
                        onChange={(e) => handleLicenseNumberChange(e.target.value)}
                        onBlur={() => handleLicenseNumberChange(licenseNumber)}
                        className={cn(
                          (fieldErrors.licenseNumber || fieldErrors.license) &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {(fieldErrors.licenseNumber || fieldErrors.license) && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.licenseNumber || fieldErrors.license}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ins">
                        Insurance Policy Number <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="ins"
                        value={insurancePolicy}
                        onChange={(e) => handleInsurancePolicyChange(e.target.value)}
                        onBlur={() => handleInsurancePolicyChange(insurancePolicy)}
                        className={cn(
                          (fieldErrors.insurancePolicy || fieldErrors.insurance) &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {(fieldErrors.insurancePolicy || fieldErrors.insurance) && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldErrors.insurancePolicy || fieldErrors.insurance}
                        </p>
                      )}
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
                    Document uploads are verified by Admin during onboarding review.
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
                    Click &apos;+ Add FAQ&apos; above to create answers to common customer questions.
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
            <>
              {/* {Object.values(fieldErrors).some(Boolean) && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-bold text-base">Please fix the following bank account errors:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
                        {Object.entries(fieldErrors)
                          .filter(([, msg]) => Boolean(msg))
                          .map(([key, msg]) => (
                            <li key={key}>{msg}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )} */}
              <Card>
                <CardHeader className="border-b border-border pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Landmark size={18} className="text-primary" /> Bank Information &amp; Payout Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="bankname">
                        Bank Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="bankname"
                        placeholder="e.g. Chase Bank"
                        value={bank.bank_name}
                        onChange={(e) => handleBankFieldChange("bank_name", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_name", bank.bank_name)}
                        className={cn(
                          fieldErrors.bank_name && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_name && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_name}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="holder">
                        Account Holder Name <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="holder"
                        placeholder="e.g. ABC Plumbing LLC"
                        value={bank.bank_account_holder}
                        onChange={(e) => handleBankFieldChange("bank_account_holder", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_account_holder", bank.bank_account_holder)}
                        className={cn(
                          fieldErrors.bank_account_holder && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_account_holder && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_account_holder}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="account">
                        Account Number <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="account"
                        placeholder="Enter account number (digits only)"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={bank.bank_account_number}
                        onChange={(e) => handleBankFieldChange("bank_account_number", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_account_number", bank.bank_account_number)}
                        className={cn(
                          fieldErrors.bank_account_number && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_account_number && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_account_number}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="routing">
                        Routing Number / IFSC <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Input
                        id="routing"
                        placeholder="Enter routing number or IFSC"
                        value={bank.bank_routing_number}
                        onChange={(e) => handleBankFieldChange("bank_routing_number", e.target.value)}
                        onBlur={() => handleBankFieldChange("bank_routing_number", bank.bank_routing_number)}
                        className={cn(
                          fieldErrors.bank_routing_number && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                      {fieldErrors.bank_routing_number && (
                        <p className="text-xs font-medium text-destructive">{fieldErrors.bank_routing_number}</p>
                      )}
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                      <Label>
                        Account Type <span className="text-destructive font-bold ml-0.5">*</span>
                      </Label>
                      <Select
                        value={bank.bank_account_type}
                        onValueChange={(val) =>
                          setBank((b) => ({
                            ...b,
                            bank_account_type: val as BankAccountType,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BANK_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="button" onClick={(e) => saveBank(e)} disabled={saving}>
                      {saving ? "Saving…" : "Save Bank Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Sidebar Summary Cards ── */}
        <aside className="space-y-6">
          {/* LOGO IMAGE UPLOADER CARD */}
          <Card className="shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Upload size={18} className="text-primary" /> Business Logo Uploader
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto flex size-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden relative shadow-sm">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={businessName || "Business Logo"}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-primary/10 font-heading text-2xl font-bold text-primary">
                    {initialsFrom(businessName || ownerName)}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="logo-upload-input-sidebar"
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Upload size={14} /> Upload New Logo
                  <input
                    id="logo-upload-input-sidebar"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  PNG, JPG or SVG logo image (Max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* BUSINESS QUICK OVERVIEW CARD */}
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={businessName || "Logo"}
                    className="size-12 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 font-heading text-sm font-bold text-primary">
                    {initialsFrom(businessName || ownerName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground text-sm">
                    {businessName.trim() || savedBusinessName.trim() || ownerName.trim() || savedOwnerName.trim() || "Your Business"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryName || "Provider"}
                  </p>
                </div>
              </div>

              {verified === "verified" && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 size={14} /> Verified Business
                </div>
              )}

              <Separator />

              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Rating</dt>
                  <dd className="font-bold text-foreground">
                    {rating != null ? `${rating.toFixed(1)} ★` : "0.0 ★"}
                  </dd>
                </div>

                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Years in Business</dt>
                  <dd className="font-semibold text-foreground">
                    {years ? `${years} Years` : "0 years"}
                  </dd>
                </div>

                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Starting Price</dt>
                  <dd className="font-bold text-primary text-sm">
                    ${startingPrice}
                  </dd>
                </div>

                {planName && (
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Subscription</dt>
                    <dd className="font-semibold text-primary">{planName}</dd>
                  </div>
                )}

                {/* {address && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border">
                    <dt className="shrink-0 text-muted-foreground">Address</dt>
                    <dd className="text-right font-medium text-foreground">
                      {[address, city, state, zip].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )} */}
              </dl>

              <Separator />

              <Button onClick={(e) => saveProfile(e)} disabled={saving} className="w-full font-bold">
                {saving ? "Saving Changes…" : "Save All Changes"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* ── FAQ Modal ── */}
      <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? "Edit FAQ" : "Add Frequently Asked Question"}
            </DialogTitle>
            <DialogDescription>
              Provide answers to questions your customers ask often.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="faq-q">Question</Label>
              <Input
                id="faq-q"
                placeholder="e.g. Do you offer emergency services?"
                value={faqForm.question}
                onChange={(e) => setFaqForm((f) => ({ ...f, question: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="faq-a">Answer</Label>
              <Textarea
                id="faq-a"
                rows={4}
                placeholder="e.g. Yes, we offer 24/7 emergency dispatch for urgent issues."
                value={faqForm.answer}
                onChange={(e) => setFaqForm((f) => ({ ...f, answer: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFaqLocal}>
              {editingFaq ? "Update FAQ" : "Add FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderProfileSettings;
