import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, StatusPill, VerifiedBadge } from "@/components/shared/primitives";
import Spinner from "@/components/ui/spinner";
import { adminApi } from "@/api/modules/admin.api";
import { formatPhone } from "@/utils/format";

export function AdminProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [selectedDocPreview, setSelectedDocPreview] = useState<{ title: string; filename: string; url?: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchProviderDetails(id);
    }
  }, [id]);

  const fetchProviderDetails = async (providerId: string) => {
    try {
      setLoading(true);
      const res: any = await adminApi.getProvider(providerId);
      const data = res?.data?.data || res?.data?.provider || res?.data || res?.provider || res;
      setProvider(data);
    } catch (err: any) {
      console.error("Failed to load provider details:", err);
      toast.error(err?.response?.data?.message || "Failed to load provider profile");
    } finally {
      setLoading(false);
    }
  };

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

  // Normalizing dynamic data fields from backend API
  const providerId = provider.id || id;
  const userObj = provider.user || {};
  const fullName = String(
    userObj.full_name ||
    userObj.name ||
    `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim() ||
    provider.fullName ||
    provider.name ||
    "Provider"
  );
  const businessName = String(provider.business_name || provider.businessName || fullName);
  const email = String(userObj.email || provider.email || "—");
  const phone = String(userObj.phone || provider.phone || "—");

  const categoryName = provider.category?.name || (typeof provider.category === "string" ? provider.category : null) || "Not Assigned";
  const subCategoryName = provider.sub_category?.name || provider.subcategory?.name || null;

  const emailVerified = userObj.email_verified === true || userObj.email_verified === 1;
  const dbStatus = String(provider.status || "").toLowerCase();
  const dbVerified = String(provider.verified || "").toLowerCase();

  const isVerified = dbVerified === "verified" || dbVerified === "approved";
  const isRejected = dbVerified === "rejected" || dbStatus === "rejected";
  const isSuspended = dbStatus === "paused" || dbStatus === "suspended";

  // Location string construction
  const locationParts = [
    provider.service_location_address,
    provider.city,
    provider.state,
    provider.country,
    provider.zip_code || provider.zip,
  ].filter(Boolean);
  const locationDisplay = locationParts.length > 0 ? locationParts.join(", ") : "Not Specified";

  // Dynamic Document URLs Extraction
  const getFullDocUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return `${apiBase.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  };

  const licenseDocUrl = getFullDocUrl(
    provider.license_document_url ||
    provider.licenseDocumentUrl ||
    provider.license_url ||
    provider.license_doc
  );

  const insuranceDocUrl = getFullDocUrl(
    provider.insurance_certificate_url ||
    provider.insuranceCertificateUrl ||
    provider.insurance_url ||
    provider.insurance_doc
  );

  // Bank Info normalization
  const bankObj = provider.bank || {};
  const bankName = bankObj.bank_name || provider.bank_name || null;
  const bankHolder = bankObj.bank_account_holder || provider.bank_account_holder || null;
  const bankType = bankObj.bank_account_type || provider.bank_account_type || null;
  const bankLast4 = bankObj.account_last4 || (provider.bank_account_number ? `****${String(provider.bank_account_number).slice(-4)}` : null);

  // Perform Approval API Call
  const handleConfirmApprove = async () => {
    try {
      setSubmitting(true);
      await adminApi.approveProvider(providerId);
      setShowVerifyModal(true);
      toast.success(`${businessName} has been verified and approved.`);
      await fetchProviderDetails(String(providerId));
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(err?.response?.data?.message || "Failed to approve provider.");
    } finally {
      setSubmitting(false);
    }
  };

  // Perform Rejection API Call
  const handleConfirmReject = async () => {
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectionError("Please enter a mandatory rejection reason.");
      return;
    }
    if (trimmedReason.length < 3) {
      setRejectionError("Rejection reason must be at least 3 characters long.");
      return;
    }
    if (trimmedReason.length > 1000) {
      setRejectionError("Rejection reason cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.rejectProvider(providerId, { reason: trimmedReason });
      setShowRejectModal(false);
      toast.error(`Provider application for ${businessName} rejected.`);
      await fetchProviderDetails(String(providerId));
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast.error(err?.response?.data?.message || "Failed to reject provider.");
    } finally {
      setSubmitting(false);
    }
  };

  // Perform Suspension / Unsuspend API Calls
  const handleConfirmSuspend = async () => {
    try {
      setSubmitting(true);
      if (isSuspended) {
        await adminApi.unsuspendProvider(providerId);
        toast.success(`Suspension lifted for ${businessName}. Account is now Active.`);
      } else {
        const payload = suspendReason.trim() ? { reason: suspendReason.trim() } : undefined;
        await adminApi.suspendProvider(providerId, payload);
        toast.success(`Provider ${businessName} has been suspended.`);
      }
      setShowSuspendModal(false);
      await fetchProviderDetails(String(providerId));
    } catch (err: any) {
      console.error("Suspension error:", err);
      toast.error(err?.response?.data?.message || "Failed to update suspension status.");
    } finally {
      setSubmitting(false);
    }
  };

  // Services list dynamic normalization
  const servicesList = Array.isArray(provider.service_types) && provider.service_types.length > 0
    ? provider.service_types
    : Array.isArray(provider.services) && provider.services.length > 0
    ? provider.services
    : [];

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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
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
                <span>📍 {locationDisplay}</span>
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
                onClick={() => setShowSuspendModal(true)}
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

      {/* DETAILED INFORMATION CARDS */}
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
                <dt className="text-xs text-muted-foreground font-medium">Full Owner Name</dt>
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
                      <AlertTriangle size={13} /> Pending
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
                <dd className="font-medium text-foreground mt-0.5">
                  {provider.years_of_experience != null
                    ? `${provider.years_of_experience} Years`
                    : "Not specified"}
                </dd>
              </div>
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

        {/* SECTION 3: SERVICES & PRICING */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Selected Service Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="rounded-xl bg-primary-soft/50 p-4 border border-primary/20 text-sm flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground block">Category:</span>
              <span className="font-bold text-primary text-base">{categoryName}</span>
              {subCategoryName && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{subCategoryName}</span>
                </>
              )}
            </div>

            {servicesList.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {servicesList.map((svc: any, idx: number) => (
                  <div
                    key={svc.id || idx}
                    className="rounded-xl border border-border p-4 bg-card shadow-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-sm text-foreground">{svc.name || svc.service_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {svc.is_active !== false ? "Active Sub-category" : "Inactive"}
                      </p>
                    </div>
                    {svc.amount != null ? (
                      <span className="font-extrabold text-primary text-sm">${svc.amount}</span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">Standard</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-lg">
                No specific sub-category service items configured yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* SECTION 4: COVERAGE INFORMATION */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Coverage Area Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-sm">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Operating City / Area</dt>
                <dd className="font-bold text-foreground mt-0.5">{provider.city || "Not specified"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Full Operating Address</dt>
                <dd className="font-medium text-foreground mt-0.5">{locationDisplay}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Service Radius</dt>
                <dd className="font-medium text-foreground mt-0.5">
                  {provider.service_radius_miles != null
                    ? `${provider.service_radius_miles} Miles`
                    : "Not specified"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* SECTION 5: BANK ACCOUNT DETAILS */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Landmark size={18} className="text-primary" /> Bank Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-sm">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Bank Name</dt>
                <dd className="font-bold text-foreground mt-0.5">{bankName || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Holder Name</dt>
                <dd className="font-medium text-foreground mt-0.5">{bankHolder || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Number</dt>
                <dd className="font-medium text-foreground mt-0.5">{bankLast4 || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Account Type</dt>
                <dd className="font-medium text-foreground capitalize mt-0.5">{bankType || "Not provided"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* SECTION 6: UPLOADED DOCUMENTS */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck size={18} className="text-primary" /> Uploaded License &amp; Documents
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
                      {provider.license_number || "No license number provided"}
                    </p>
                    {licenseDocUrl ? (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
                        ✓ License Uploaded
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-warning bg-warning-soft px-2 py-0.5 rounded-full">
                        Not Uploaded
                      </span>
                    )}
                  </div>
                </div>
                {licenseDocUrl ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs shrink-0"
                    onClick={() =>
                      setSelectedDocPreview({
                        title: "Business License Document",
                        filename: `License_${providerId}`,
                        url: licenseDocUrl,
                      })
                    }
                  >
                    <Eye size={13} /> View
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="gap-1 text-xs shrink-0 opacity-50">
                    <Eye size={13} /> No File
                  </Button>
                )}
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
                      {provider.insurance_policy || "No policy number provided"}
                    </p>
                    {insuranceDocUrl ? (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-success bg-success-soft px-2 py-0.5 rounded-full">
                        ✓ Active Coverage Uploaded
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-warning bg-warning-soft px-2 py-0.5 rounded-full">
                        Not Uploaded
                      </span>
                    )}
                  </div>
                </div>
                {insuranceDocUrl ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs shrink-0"
                    onClick={() =>
                      setSelectedDocPreview({
                        title: "Insurance Certificate",
                        filename: `Insurance_${providerId}`,
                        url: insuranceDocUrl,
                      })
                    }
                  >
                    <Eye size={13} /> View
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="gap-1 text-xs shrink-0 opacity-50">
                    <Eye size={13} /> No File
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              onClick={handleConfirmSuspend}
              disabled={submitting}
            >
              {isSuspended ? "Lift Suspension" : "Confirm Suspension"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VERIFY SUCCESS POPUP DIALOG */}
      <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
        <DialogContent className="sm:max-w-md text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 size={34} />
          </span>
          <DialogTitle className="mt-4 font-display text-xl font-bold text-foreground">
            Provider Verified &amp; Approved
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            <strong>{businessName}</strong> has been successfully verified. An automated confirmation email was sent to the provider.
          </DialogDescription>
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
                placeholder="Enter mandatory reason for rejection (min 3 characters)..."
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

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocPreview && (
        <Dialog open={Boolean(selectedDocPreview)} onOpenChange={() => setSelectedDocPreview(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between gap-2">
                <span>{selectedDocPreview.title}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-black/5 p-4 text-center flex flex-col items-center justify-center min-h-[300px]">
              {selectedDocPreview.url ? (
                selectedDocPreview.url.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={selectedDocPreview.url}
                    title={selectedDocPreview.title}
                    className="w-full h-[500px] rounded-lg border border-border"
                  />
                ) : (
                  <img
                    src={selectedDocPreview.url}
                    alt={selectedDocPreview.title}
                    className="max-h-[500px] w-full object-contain rounded-lg shadow-sm"
                  />
                )
              ) : (
                <div className="space-y-3 py-10">
                  <FileText size={48} className="mx-auto text-primary" />
                  <p className="font-bold text-sm text-foreground">{selectedDocPreview.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    Document uploaded for provider {businessName}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground truncate max-w-xs">
                {selectedDocPreview.url || selectedDocPreview.filename}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDocPreview(null)}>
                  Close
                </Button>
                {selectedDocPreview.url && (
                  <Button size="sm" asChild className="gap-1.5 text-xs">
                    <a href={selectedDocPreview.url} target="_blank" rel="noreferrer" download>
                      <Download size={14} /> Download Document
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminProviderDetail;
