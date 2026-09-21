import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  HelpCircle,
  ImageIcon,
  Loader2,
  ShieldAlert,
  Trash2,
  UploadCloud,
  User,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  PageHeader,
  StatusPill,
  EmptyState,
} from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { getOrderDetails } from "@/services/order";
import { createDisputeApi } from "@/services/support/support.service";
import { normalizeBooking } from "@/utils/bookingAdapter";

const CARD_SHADOW_CLASS = "rounded-2xl border border-border bg-card p-6 shadow-card";

const ReportIssue = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bookingRaw, setBookingRaw] = useState<any>(null);
  const [normalized, setNormalized] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [issueType, setIssueType] = useState("damaged_item");
  const [description, setDescription] = useState("");
  const [refundRequested, setRefundRequested] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res: any = await getOrderDetails(id);
        const rawPayload = res?.data?.data || res?.data || res;
        const bkg = rawPayload?.booking || rawPayload?.data?.booking || rawPayload;
        if (bkg) {
          setBookingRaw(bkg);
          setNormalized(normalizeBooking(bkg));
        }
      } catch (err) {
        console.error("Failed to load booking details:", err);
        toast.error("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files) as File[];

    if (images.length + files.length > 5) {
      toast.error("Maximum 5 evidence images allowed.");
      return;
    }

    const allowedTypes = /jpeg|jpg|png|webp|heic|heif/i;

    const filteredFiles = files.filter((file) => {
      if (!allowedTypes.test(file.name)) {
        toast.error(`"${file.name}" is not a supported image file.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds maximum size of 5MB.`);
        return false;
      }
      return true;
    });

    if (filteredFiles.length > 0) {
      setImages((prev) => [...prev, ...filteredFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please provide a detailed description of the issue.");
      return;
    }

    const requestedNum = Number(refundRequested);
    if (!isNaN(requestedNum) && requestedNum > totalAmount && totalAmount > 0) {
      toast.error(`Refund requested (${usd(requestedNum)}) cannot exceed total customer payment (${usd(totalAmount)}).`);
      return;
    }

    const formData = new FormData();
    formData.append("booking_id", String(bookingRaw?.id || id));
    formData.append("reason", issueType);
    formData.append("issue_type", issueType);
    formData.append("description", description.trim());
    if (refundRequested.trim()) {
      formData.append("refund_requested", refundRequested.trim());
    }

    images.forEach((file) => {
      formData.append("evidence", file);
    });

    setSubmitting(true);
    try {
      const res = await createDisputeApi(formData);
      if (res?.data?.success) {
        toast.success("Issue report submitted successfully! Our support team will review within 24 hours.");
        navigate(`/order/${bookingRaw?.id || id}`);
      } else {
        toast.error(res?.data?.message || "Failed to submit issue report.");
      }
    } catch (error: any) {
      console.error("Dispute error:", error);
      toast.error(error?.response?.data?.message || "Failed to submit issue report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (!bookingRaw || !normalized) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-4">
        <Link
          to="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} /> All Bookings
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Booking Not Found"
          description="The booking you are trying to report an issue for could not be found."
          action={
            <Button asChild>
              <Link to="/customer/bookings">Back to My Bookings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const displayId = normalized.displayId || `BK-${bookingRaw.id}`;
  const providerName = normalized.providerName || "Assigned Provider";
  const serviceName = normalized.serviceName || "Marketplace Service";
  const categoryName = normalized.categoryName || "General Service";
  const formattedDate = normalized.formattedDate || "N/A";
  const status = normalized.appointmentStatus || normalized.status || "Completed";
  const totalAmount = normalized.totalAmount || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back Link */}
      <Link
        to={`/order/${bookingRaw.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} /> Back to Order #{displayId}
      </Link>

      <PageHeader
        title="Report an Issue & Request Support"
        subtitle={`Submit a formal dispute or request resolution for booking ${displayId}.`}
      />

      {/* Booking Summary Banner Card */}
      <section className={CARD_SHADOW_CLASS}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1">
              <FileText size={13} className="text-primary" /> Order ID
            </p>
            <p className="font-mono font-bold text-sm text-foreground">{displayId}</p>
            <p className="text-[11px] text-muted-foreground truncate">{categoryName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1">
              <User size={13} className="text-primary" /> Assigned Provider
            </p>
            <p className="font-bold text-sm text-foreground truncate">{providerName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{serviceName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1">
              <Calendar size={13} className="text-primary" /> Service Date
            </p>
            <p className="font-bold text-sm text-foreground">{formattedDate}</p>
            <p className="text-[11px] text-muted-foreground">Total: {usd(totalAmount)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground font-medium flex items-center gap-1">
              <Clock size={13} className="text-primary" /> Order Status
            </p>
            <div className="pt-0.5">
              <StatusPill status={status} />
            </div>
          </div>
        </div>
      </section>

      {/* Issue Report Form */}
      <section className={CARD_SHADOW_CLASS}>
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" /> Issue Details &amp; Evidence
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provide clear details about what went wrong so our support team can investigate and resolve your request promptly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="issueType" className="text-xs font-bold text-foreground">
                  Issue Type <span className="text-destructive">*</span>
                </Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger id="issueType" className="h-10 text-xs">
                    <SelectValue placeholder="Select primary issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged_item">Damaged Items or Property</SelectItem>
                    <SelectItem value="late_delivery">Late Arrival / Provider No-Show</SelectItem>
                    <SelectItem value="missing_item">Incomplete Service / Missing Items</SelectItem>
                    <SelectItem value="wrong_service">Wrong Service / Poor Quality</SelectItem>
                    <SelectItem value="other">Other Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="refundAmount" className="text-xs font-bold text-foreground">
                    Refund Amount Requested (USD)
                  </Label>
                  {totalAmount > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Max Refundable: <strong>{usd(totalAmount)}</strong>
                    </span>
                  )}
                </div>

                {/* Quick Option Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={refundRequested === String(totalAmount) ? "default" : "outline"}
                    onClick={() => setRefundRequested(String(totalAmount))}
                    className="h-7 text-[11px] gap-1 px-2.5"
                  >
                    Full Refund ({usd(totalAmount)})
                  </Button>
                  {totalAmount > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant={refundRequested === (totalAmount / 2).toFixed(2) ? "default" : "outline"}
                      onClick={() => setRefundRequested((totalAmount / 2).toFixed(2))}
                      className="h-7 text-[11px] px-2.5"
                    >
                      50% Partial ({usd(totalAmount / 2)})
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant={refundRequested === "0" ? "secondary" : "ghost"}
                    onClick={() => setRefundRequested("0")}
                    className="h-7 text-[11px] px-2.5"
                  >
                    No Refund (0)
                  </Button>
                </div>

                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="refundAmount"
                    type="number"
                    min="0"
                    max={totalAmount}
                    step="0.01"
                    placeholder={`e.g. ${totalAmount}`}
                    value={refundRequested}
                    onChange={(e) => setRefundRequested(e.target.value)}
                    className={`pl-8 text-xs h-10 ${
                      Number(refundRequested) > totalAmount ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                  />
                </div>

                {Number(refundRequested) > totalAmount && (
                  <p className="text-[11px] font-bold text-destructive">
                    ⚠️ Refund requested ({usd(Number(refundRequested))}) cannot exceed booking payment total ({usd(totalAmount)}).
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-foreground">
                  Describe What Happened <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Please describe the issue in detail (what was expected vs what occurred)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs min-h-[130px]"
                />
              </div>
            </div>

            {/* Right Column: Evidence Upload */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">
                  Upload Photo Evidence (Optional)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Attach photos or screenshots (PNG, JPG, WEBP — Max 5MB per file, up to 5 images).
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-muted/20">
                <input
                  type="file"
                  multiple
                  accept=".jpeg,.jpg,.png,.webp,.heic,.heif"
                  id="fileUpload"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Click or Drag &amp; Drop Photos</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Images Preview Grid */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Attached Files ({images.length}/5)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((file, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-border bg-card">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Evidence preview ${idx + 1}`}
                          className="h-20 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                          title="Remove image"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="p-1 text-[10px] truncate text-muted-foreground text-center bg-card">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Review Process & Dispute Policy Callout */}
      <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3 text-xs">
        <h3 className="font-display text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <ShieldAlert size={16} /> Marketplace Protection &amp; Resolution Process
        </h3>
        <ul className="space-y-1.5 text-muted-foreground list-disc pl-5 text-[11px]">
          <li>
            <strong>Payment Protection:</strong> Submitting a dispute automatically freezes provider payout release until our support team completes review.
          </li>
          <li>
            <strong>Review SLA:</strong> Our dispute resolution agents will investigate and respond within <strong>24 hours</strong>.
          </li>
          <li>
            <strong>Communication:</strong> Our team may contact you via email or platform messages if additional documentation is required.
          </li>
        </ul>
      </section>

      {/* Submit Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" asChild disabled={submitting}>
          <Link to={`/order/${bookingRaw.id}`}>Cancel</Link>
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
          Submit Issue &amp; Open Dispute
        </Button>
      </div>
    </div>
  );
};

export default ReportIssue;
