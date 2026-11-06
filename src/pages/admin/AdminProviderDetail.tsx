import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Landmark,
  MapPin,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentPreviewModal } from "@/components/shared/DocumentPreviewModal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, StatusPill, VerifiedBadge } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import Spinner from "@/components/ui/spinner";
import { useAdminProviderDetail, maskLast4 } from "@/hooks/useAdminProviderDetail";
import { formatPhone, formatDate } from "@/utils/format";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { CARD_SECTION_SHADOW } from "@/styles";

export function AdminProviderDetail() {
  const {
    id,
    provider,
    loading,
    submitting,
    showVerifyModal,
    setShowVerifyModal,
    showRejectModal,
    setShowRejectModal,
    showSuspendModal,
    setShowSuspendModal,
    showEditModal,
    setShowEditModal,
    rejectionReason,
    setRejectionReason,
    rejectionError,
    setRejectionError,
    suspendReason,
    setSuspendReason,
    selectedDocPreview,
    setSelectedDocPreview,
    editForm,
    setEditForm,
    handleConfirmApprove,
    handleConfirmReject,
    handleConfirmSuspend,
    handleQuickUnsuspend,
    handleSaveEdit,
    providerId,
    fullName,
    businessName,
    email,
    phone,
    categoryName,
    subCategoryName,
    emailVerified,
    isVerified,
    isRejected,
    isSuspended,
    licenseDocUrl,
    insuranceDocUrl,
    portfolio,
    faqs,
    certifications,
    displayServices,
    displayYears,
    availabilityByDay,
    customSpecialty,
    selectedServiceTypes,
  } = useAdminProviderDetail();

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <Spinner />
        <p className="mt-3 text-sm text-muted-foreground">Loading provider details...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="py-20 text-center space-y-4">
        <h1 className="font-display text-xl font-bold text-foreground">Provider Not Found</h1>
        <p className="text-sm text-muted-foreground">The requested provider account does not exist or was removed.</p>
        <Button asChild className="mt-4">
          <Link to="/admin/providers">Back to Provider Directory</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Back Button Navigation */}
      <Link
        to="/admin/providers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} /> Back to Provider Directory
      </Link>

      {/* Header Summary Card */}
      <div className={CARD_SECTION_SHADOW}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar initials={businessName.substring(0, 2).toUpperCase()} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold text-foreground">
                  {businessName}
                </h1>
                {isVerified && <VerifiedBadge />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Owner: <strong className="text-foreground">{fullName}</strong> · Category: {categoryName}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span>📧 {email}</span>
                <span>📱 {phone !== "—" ? formatPhone(phone) : "—"}</span>
                <span>📍 {[provider.city, provider.state, provider.country].filter(Boolean).join(", ") || "Indore, MP"}</span>
              </div>
            </div>
          </div>

          {/* Status Badges & Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:items-end">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Email Verification Status */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Email Verification</span>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-soft text-success">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-soft text-warning">
                    <AlertTriangle size={13} /> Pending
                  </span>
                )}
              </div>

              {/* Provider Verification Status */}
              <div className="flex flex-col items-start gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">Provider Verification</span>
                <StatusPill status={isVerified ? "Verified" : isRejected ? "Rejected" : isSuspended ? "Suspended" : "Pending"} />
              </div>
            </div>

            {/* ACTION BUTTONS: Approve, Reject, Suspend */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {!isVerified && !isRejected && !isSuspended && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                    onClick={() => {
                      setRejectionReason("");
                      setRejectionError("");
                      setShowRejectModal(true);
                    }}
                    disabled={submitting}
                  >
                    <XCircle size={14} className="mr-1" /> Reject Provider
                  </Button>

                  <Button size="sm" onClick={handleConfirmApprove} disabled={submitting} className="gap-1 text-xs">
                    <CheckCircle2 size={15} /> Approve Provider
                  </Button>
                </>
              )}

              {/* Suspend / Lift Suspension Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={isSuspended ? handleQuickUnsuspend : () => setShowSuspendModal(true)}
                disabled={submitting}
                className={`gap-1 text-xs ${
                  isSuspended
                    ? "text-success border-success/30 hover:bg-success/10"
                    : "text-amber-700 border-amber-300 hover:bg-amber-500/10"
                }`}
              >
                {isSuspended ? (
                  <>
                    <PlayCircle size={14} /> Lift Suspension
                  </>
                ) : (
                  <>
                    <PauseCircle size={14} /> Suspend Provider
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Rejection Reason Banner if Rejected */}
        {isRejected && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
            <XCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Application Rejected by Admin</p>
              <p className="mt-0.5 text-xs opacity-90">
                Reason: {provider.rejection_reason || provider.rejectionReason || "Verification documents incomplete or invalid."}
              </p>
            </div>
          </div>
        )}

        {/* Suspension Banner if Suspended */}
        {isSuspended && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-500/10 p-4 text-sm text-amber-900 flex items-start gap-3">
            <PauseCircle size={18} className="shrink-0 mt-0.5 text-amber-700" />
            <div>
              <p className="font-bold">Provider Account Suspended</p>
              <p className="mt-0.5 text-xs opacity-90">
                This provider account is currently suspended by Admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE PAGE RESPONSIVE CARDS */}
      <div className="space-y-6">
        {/* SECTION 1: ACCOUNT INFORMATION */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User size={18} className="text-primary" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Owner Full Name</dt>
                <dd className="font-bold text-foreground mt-0.5">{fullName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Email Address</dt>
                <dd className="font-medium text-foreground mt-0.5">{email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Mobile Number</dt>
                <dd className="font-medium text-foreground mt-0.5">{phone !== "—" ? formatPhone(phone) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Email Verification Status</dt>
                <dd className="mt-0.5">
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                      <AlertTriangle size={13} /> Unverified
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* SECTION 2: BUSINESS INFORMATION */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 size={18} className="text-primary" /> Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Registered Business Name</dt>
                <dd className="font-bold text-foreground mt-0.5">{businessName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Years of Experience</dt>
                <dd className="font-medium text-foreground mt-0.5">{displayYears}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Primary Category</dt>
                <dd className="font-medium text-foreground mt-0.5">{categoryName}</dd>
              </div>
              {customSpecialty && (
                <div className="rounded-xl border border-accent/30 bg-accent-soft/30 p-2.5 sm:col-span-2">
                  <dt className="text-xs font-bold text-accent-soft-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent shrink-0" /> Custom Specialty Added by Provider
                  </dt>
                  <dd className="font-extrabold text-foreground mt-1 text-sm">{customSpecialty}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Status</dt>
                <dd className="font-medium text-foreground capitalize mt-0.5">{provider.status || "active"}</dd>
              </div>
            </div>

            <Separator />

            <div>
              <dt className="text-xs text-muted-foreground font-medium">Service Description</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground rounded-xl bg-muted/50 p-4 border border-border">
                {provider.service_description || provider.description || provider.bio || "No description provided."}
              </dd>
            </div>
          </CardContent>
        </Card>

        {/* SECTION: SUBSCRIPTION & MEMBERSHIP PLAN */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Subscription &amp; Membership Plan
              </CardTitle>
              {provider?.subscription && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    provider.subscription.status === "active"
                      ? "bg-success-soft text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      provider.subscription.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/60"
                    }`}
                  />
                  {provider.subscription.status ? String(provider.subscription.status).toUpperCase() : "ACTIVE"}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {provider?.subscription ? (
              <div className="space-y-6">
                {/* Main Plan Highlight Box */}
                <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-lg font-bold text-foreground">
                        {provider.subscription.name || provider.subscription.plan?.name || "Subscription Plan"}
                      </h4>
                      {(provider.subscription.plan?.slug === "gold-membership" ||
                        provider.subscription.name?.toLowerCase().includes("gold")) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-500/20">
                          <Sparkles size={12} className="text-amber-600 shrink-0" /> Default Registration Plan
                        </span>
                      )}
                    </div>
                    {provider.subscription.plan?.description && (
                      <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                        {provider.subscription.plan.description}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-2xl font-extrabold text-foreground">
                      ${provider.subscription.price_paid != null ? provider.subscription.price_paid : (provider.subscription.plan?.price ?? 0)}
                      <span className="text-xs font-medium text-muted-foreground">
                        /{provider.subscription.plan?.billing_interval || "month"}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 capitalize block mt-0.5">
                      Payment: {provider.subscription.payment_status || "Paid"}
                    </span>
                  </div>
                </div>

                {/* Plan Metrics / Details Grid */}
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Billing Interval</dt>
                    <dd className="font-semibold text-foreground mt-0.5 capitalize">
                      {provider.subscription.plan?.billing_interval ? `Per ${provider.subscription.plan.billing_interval}` : "Monthly"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Proposal Limit</dt>
                    <dd className="font-semibold text-foreground mt-0.5">
                      {provider.subscription.plan?.proposal_limit != null
                        ? `${provider.subscription.plan.proposal_limit} proposals / mo`
                        : "Unlimited proposals"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Plan Start Date</dt>
                    <dd className="font-semibold text-foreground mt-0.5">
                      {provider.subscription.start_date ? formatDate(provider.subscription.start_date) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground font-medium">Renewal / Expiration</dt>
                    <dd className="font-semibold text-foreground mt-0.5">
                      {provider.subscription.end_date ? formatDate(provider.subscription.end_date) : "—"}
                    </dd>
                  </div>
                </dl>

                {/* Plan Features / Inclusions if available */}
                {Array.isArray(provider.subscription.plan?.features) && provider.subscription.plan.features.length > 0 && (
                  <div>
                    <dt className="text-xs text-muted-foreground font-semibold mb-2">Plan Inclusions &amp; Benefits</dt>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {provider.subscription.plan.features.map((feat: any, idx: number) => {
                        const featText = typeof feat === "string" ? feat : feat?.name || feat?.text || JSON.stringify(feat);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs font-medium text-foreground bg-muted/40 rounded-lg p-2.5 border border-border"
                          >
                            <CheckCircle2 size={14} className="text-success shrink-0" />
                            <span>{featText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground italic">
                No active or historical subscription found for this provider.
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: SERVICES & PRICING */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Selected Service Structure &amp; Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="rounded-xl bg-primary-soft/50 p-4 border border-primary/20 text-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground block font-medium">Primary Category:</span>
                <span className="font-bold text-primary text-base">{categoryName}</span>
              </div>

              {selectedServiceTypes.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground font-medium block mb-1.5">
                    Selected Trades &amp; Subcategories ({selectedServiceTypes.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServiceTypes.map((st: any) => (
                      <span
                        key={st.id}
                        className="inline-flex items-center rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-foreground border border-border shadow-xs"
                      >
                        {st.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {customSpecialty && (
                <div className="rounded-lg bg-accent-soft/60 border border-accent/30 p-3 mt-1">
                  <span className="text-xs font-bold text-accent-soft-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent shrink-0" /> Provider-Added Custom Specialties:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customSpecialty.split(",").map((s: string) => s.trim()).filter(Boolean).map((spec: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-bold text-foreground shadow-xs"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {displayServices.length > 0 ? (
                displayServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="rounded-xl border border-border p-4 bg-card shadow-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-sm text-foreground">{svc.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{svc.unit}</p>
                    </div>
                    <span className="font-extrabold text-primary text-sm">
                      {svc.price > 0 ? usd(svc.price) : "Custom Quote"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic col-span-2">No custom pricing or services listed.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: COVERAGE INFORMATION */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Coverage Area &amp; Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-sm">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Service Location Address</dt>
                <dd className="font-bold text-foreground mt-0.5 leading-relaxed">
                  {provider.service_location_address || "Address not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">City, State &amp; ZIP</dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {[provider.city, provider.state, provider.zip_code].filter(Boolean).join(", ") || "Indore, MP"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Service Radius</dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {provider.service_radius_miles ? `${provider.service_radius_miles} Miles` : "Standard City Coverage"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* SECTION 5: UPLOADED IMAGES & DOCUMENTS */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck size={18} className="text-primary" /> Uploaded Verification Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* License Document */}
              <div className="rounded-xl border border-border p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                    <FileText size={20} />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Business License Document</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {provider.license_number ? `License #${provider.license_number}` : "License document attached"}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
                      ✓ Document Attached
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs shrink-0"
                  onClick={() =>
                    setSelectedDocPreview({
                      title: "Business License Document",
                      filename: `License_${providerId}.jpg`,
                      documentUrl: licenseDocUrl,
                    })
                  }
                >
                  <Eye size={13} /> View
                </Button>
              </div>

              {/* Insurance Certificate */}
              <div className="rounded-xl border border-border p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Insurance Certificate</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {provider.insurance_policy ? `Policy #${provider.insurance_policy}` : "Insurance certificate attached"}
                    </p>
                    <span className="inline-block mt-2 text-[11px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
                      ✓ Coverage Verified
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs shrink-0"
                  onClick={() =>
                    setSelectedDocPreview({
                      title: "General Liability Insurance Certificate",
                      filename: `Insurance_${providerId}.jpg`,
                      documentUrl: insuranceDocUrl,
                    })
                  }
                >
                  <Eye size={13} /> View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 6: BANKING & PAYMENT INFORMATION */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Banking &amp; Payout Account
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-sm">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Holder</dt>
                <dd className="font-bold text-foreground mt-0.5">
                  {provider.bank_account_holder || provider.bank?.bank_account_holder || "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Bank Name</dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {provider.bank_name || provider.bank?.bank_name || "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Type</dt>
                <dd className="font-medium text-foreground mt-0.5 capitalize">
                  {provider.bank_account_type || provider.bank?.bank_account_type || "checking"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Number (Masked)</dt>
                <dd className="font-mono font-bold text-foreground mt-0.5">
                  {maskLast4(provider.bank_account_number || provider.bank?.account_last4)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* SECTION 7: WORKING HOURS & WEEKLY AVAILABILITY */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Working Hours &amp; Weekly Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {availabilityByDay.map(({ day, slots }) => (
                <div
                  key={day}
                  className={`rounded-xl border p-3 text-center space-y-2 ${
                    slots.length > 0 ? "border-primary/30 bg-primary-soft/20" : "border-border bg-muted/20 opacity-60"
                  }`}
                >
                  <p className="font-bold text-xs text-foreground uppercase tracking-wide">{day}</p>
                  {slots.length > 0 ? (
                    <div className="space-y-1">
                      {slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="block text-[11px] font-semibold text-primary bg-background px-2 py-1 rounded-md border border-primary/20"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="block text-[11px] text-muted-foreground italic">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SECTION 8: ADDITIONAL DETAILS (FAQs & Certifications) */}
        {(faqs.length > 0 || certifications.length > 0 || portfolio.length > 0) && (
          <Card className="shadow-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award size={18} className="text-primary" /> Portfolio, FAQs &amp; Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-sm">
              {/* FAQs */}
              {faqs.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    Frequently Asked Questions ({faqs.length})
                  </h4>
                  <div className="space-y-3">
                    {faqs.map((faq: any, idx: number) => (
                      <div key={idx} className="rounded-xl border border-border p-4 bg-muted/20">
                        <p className="font-bold text-foreground text-sm">Q: {faq.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Certifications &amp; Badges
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20"
                      >
                        <Award size={14} /> {typeof cert === "string" ? cert : cert.name || cert.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {portfolio.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    Portfolio Images ({portfolio.length})
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {portfolio.map((item: any, idx: number) => {
                      const imgUrl = resolveMediaUrl(item.url || item.image || item);
                      return (
                        <div key={idx} className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.caption || `Portfolio ${idx + 1}`} className="w-full h-32 object-cover" />
                          ) : (
                            <div className="w-full h-32 bg-muted/40 grid place-items-center">
                              <ImageIcon size={24} className="text-muted-foreground" />
                            </div>
                          )}
                          {item.caption && (
                            <p className="p-2 text-xs text-muted-foreground truncate">{item.caption}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* VERIFY SUCCESS POPUP DIALOG */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-md text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 size={34} />
          </span>
          <DialogTitle className="mt-4 font-display text-xl font-bold">
            Provider Verified &amp; Approved
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            <strong>{businessName}</strong> has been successfully verified.
          </DialogDescription>
          <p className="text-xs font-medium text-foreground bg-muted p-3 rounded-xl mt-2">
            The provider can now receive service requests and start taking bookings.
          </p>
          <div className="mt-5">
            <Button className="w-full" onClick={() => setShowVerifyModal(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* REJECT PROVIDER MODAL */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <XCircle size={20} /> Reject Provider Application
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to reject this provider application?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rej_reason" className="text-sm font-semibold">
                Reason for rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rej_reason"
                rows={4}
                placeholder="Enter mandatory reason for rejection..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (e.target.value.trim()) setRejectionError("");
                }}
              />
              {rejectionError && (
                <p className="text-xs font-semibold text-destructive">{rejectionError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={submitting}>
              Reject Provider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUSPEND PROVIDER MODAL */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-800">
              <PauseCircle size={20} /> {isSuspended ? "Lift Provider Suspension" : "Suspend Provider Account"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isSuspended
                ? `Re-activate ${businessName} account so they can receive service bookings.`
                : `Temporarily suspend ${businessName} account from accepting new bookings.`}
            </DialogDescription>
          </DialogHeader>

          {!isSuspended && (
            <div className="space-y-2 py-2">
              <Label htmlFor="s_reason" className="text-xs font-semibold">Reason for Suspension (optional)</Label>
              <Textarea
                id="s_reason"
                rows={3}
                placeholder="Enter reason for suspending this provider..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
              Cancel
            </Button>
            <Button
              variant={isSuspended ? "default" : "destructive"}
              onClick={isSuspended ? handleQuickUnsuspend : handleConfirmSuspend}
              disabled={submitting}
            >
              {isSuspended ? "Lift Suspension" : "Confirm Suspension"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocPreview && (
        <DocumentPreviewModal
          open={Boolean(selectedDocPreview)}
          onOpenChange={(open) => !open && setSelectedDocPreview(null)}
          documentUrl={selectedDocPreview.documentUrl}
          title={selectedDocPreview.title}
          filename={selectedDocPreview.filename}
        />
      )}
    </div>
  );
}

export default AdminProviderDetail;
