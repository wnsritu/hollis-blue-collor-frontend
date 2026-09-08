import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileText,
  Image as ImageIcon,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentPreviewModal } from "@/components/shared/DocumentPreviewModal";
import { Avatar, StatusPill, VerifiedBadge } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import Spinner from "@/components/ui/spinner";
import { adminApi } from "@/api/modules/admin.api";
import { formatPhone } from "@/utils/format";
import { resolveMediaUrl } from "@/utils/mediaUrl";

// Safely parse JSON strings or return fallback
function parseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

// Mask account digits safely
function maskLast4(num: any) {
  if (!num) return "N/A";
  const s = String(num).trim();
  if (s.length <= 4) return "****";
  return `****${s.slice(-4)}`;
}

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
  const [showEditModal, setShowEditModal] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [selectedDocPreview, setSelectedDocPreview] = useState<{
    title: string;
    filename: string;
    documentUrl?: string | null;
  } | null>(null);

  // Edit Provider Form State
  const [editForm, setEditForm] = useState({
    businessName: "",
    fullName: "",
    email: "",
    phone: "",
    category: "",
    status: "active",
  });

  useEffect(() => {
    if (id) {
      fetchProviderDetails(id);
    }
  }, [id]);

  const fetchProviderDetails = async (providerId: string) => {
    try {
      setLoading(true);
      const res: any = await adminApi.getProvider(providerId);
      const data = res?.data?.data || res?.data || res?.provider || res;
      setProvider(data);
      setEditForm({
        businessName: data.business_name || data.name || "",
        fullName:
          data.user?.full_name ||
          `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim() ||
          data.fullName ||
          "",
        email: data.user?.email || data.email || "",
        phone: data.user?.phone || data.phone || "",
        category: data.category?.name || data.category || "General Service",
        status: data.status || "active",
      });
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

  // Normalizing fields
  const providerId = provider.id || id;
  const fullName = String(
    provider.user?.full_name ||
      `${provider.user?.first_name || ""} ${provider.user?.last_name || ""}`.trim() ||
      provider.fullName ||
      provider.name ||
      "Provider Owner"
  );
  const businessName = String(provider.business_name || provider.name || fullName);
  const email = String(provider.user?.email || provider.email || "—");
  const phone = String(provider.user?.phone || provider.phone || "—");
  const rawCat = provider.category;
  const categoryName = typeof rawCat === "object" ? (rawCat?.name || "General Service") : String(rawCat || "General Service");
  const emailVerified = provider.user?.email_verified !== false && provider.emailVerified !== false;
  const dbStatus = String(provider.status || "").toLowerCase();
  const dbVerified = String(provider.verified || "").toLowerCase();

  const isVerified = dbVerified === "verified" || dbVerified === "approved";
  const isRejected = dbVerified === "rejected" || dbStatus === "rejected";
  const isSuspended = dbStatus === "paused" || dbStatus === "suspended";

  // Document URLs
  const licenseDocUrl = resolveMediaUrl(
    provider.license_document_url || provider.license_document || provider.licenseDocumentUrl
  );
  const insuranceDocUrl = resolveMediaUrl(
    provider.insurance_certificate_url || provider.insurance_certificate || provider.insuranceCertificateUrl
  );

  // Parsed JSON data
  const offeredServices = parseJson<string[]>(provider.offered_services, []);
  const servicePricing = parseJson<Record<string, any>>(provider.service_pricing, {});
  const portfolio = parseJson<Array<{ url?: string; image?: string; caption?: string }>>(provider.portfolio, []);
  const faqs = parseJson<Array<{ question: string; answer: string }>>(provider.faqs, []);
  const certifications = parseJson<string[]>(provider.certifications, []);

  // Compute pricing items from service_pricing or fallback to services array
  const pricingItems = Object.entries(servicePricing)
    .filter(([_, cfg]: [string, any]) => cfg && typeof cfg === "object" && cfg.offered !== false)
    .map(([name, cfg]: [string, any]) => ({
      id: name,
      name,
      price: Number(cfg.price || 0),
      unit: cfg.unit || "flat rate",
    }));

  const displayServices =
    pricingItems.length > 0
      ? pricingItems
      : Array.isArray(provider.services) && provider.services.length > 0
      ? provider.services.map((s: any) => ({
          id: String(s.id),
          name: s.service_type?.name || s.name || "Service",
          price: Number(s.amount || s.price || 0),
          unit: "flat rate",
        }))
      : offeredServices.map((name, idx) => ({
          id: String(idx),
          name,
          price: 0,
          unit: "quoted price",
        }));

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

  const experienceYears = Number(provider.years_of_experience || 0);
  const displayYears = experienceYears > 70 ? "Not specified" : `${experienceYears} Years`;

  // Process Weekly Availabilities
  const rawAvailabilities = Array.isArray(provider.availabilities) ? provider.availabilities : [];
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const slotMap: Record<number, string> = {
    1: "Morning (8am-12pm)",
    2: "Afternoon (12pm-4pm)",
    3: "Evening (4pm-8pm)",
    4: "Night (8pm-11pm)",
  };
  const availabilityByDay = dayOrder.map((day) => {
    const dayItems = rawAvailabilities.filter((a: any) => a.day_of_week === day);
    const slots = dayItems.map((a: any) => {
      const slotId = Number(a.time_slot_id || a.slot_id);
      return slotMap[slotId] || a.time_slot?.name || `Slot #${a.time_slot_id}`;
    });
    return { day, slots };
  });

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
                Submitted by <strong className="text-foreground">{fullName}</strong> · {categoryName}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span>📧 {email}</span>
                <span>📱 {formatPhone(phone)}</span>
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
                onClick={() => setShowSuspendModal(true)}
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
                Reason: {provider.rejection_reason || provider.rejectionReason || "Business verification documents are incomplete or invalid."}
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
                This provider account is currently suspended by Admin and cannot receive new service requests.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE PAGE RESPONSIVE CARDS */}
      <div className="space-y-6">
        {/* SECTION 1: ACCOUNT INFORMATION */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
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
                <dd className="font-medium text-foreground mt-0.5">{formatPhone(phone)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium">Email Verification Status</dt>
                <dd className="mt-0.5">
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                      <CheckCircle2 size={13} /> Verified via OTP
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
            </div>

            <Separator />

            <div>
              <dt className="text-xs text-muted-foreground font-medium">Business Description</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground rounded-xl bg-muted/50 p-4 border border-border">
                {provider.service_description || "No description provided."}
              </dd>
            </div>
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
            <div className="rounded-xl bg-primary-soft/50 p-4 border border-primary/20 text-sm">
              <span className="text-xs text-muted-foreground block">Category Hierarchy</span>
              <span className="font-bold text-primary text-base">Home Services</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{categoryName}</span>
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
              onClick={handleConfirmSuspend}
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
