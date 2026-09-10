import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "@/services/admin";
import { resolveMediaUrl } from "@/utils/mediaUrl";

export function parseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

export function maskLast4(num: any) {
  if (!num) return "N/A";
  const s = String(num).trim();
  if (s.length <= 4) return "****";
  return `****${s.slice(-4)}`;
}

export function useAdminProviderDetail() {
  const { id } = useParams<{ id: string }>();

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

  const handleConfirmApprove = async () => {
    try {
      setSubmitting(true);
      await adminApi.approveProvider(id!);
      setShowVerifyModal(false);
      toast.success("Provider has been officially verified!");
      await fetchProviderDetails(id!);
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(err?.response?.data?.message || "Failed to approve provider application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectionError("Please specify a reason for rejection.");
      return;
    }
    if (trimmedReason.length < 3) {
      setRejectionError("Rejection reason must be at least 3 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.rejectProvider(id!, { reason: trimmedReason });
      setShowRejectModal(false);
      toast.error("Provider application rejected.");
      await fetchProviderDetails(id!);
    } catch (err: any) {
      console.error("Reject error:", err);
      toast.error(err?.response?.data?.message || "Failed to reject provider application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSuspend = async () => {
    try {
      setSubmitting(true);
      const payload = suspendReason.trim() ? { reason: suspendReason.trim() } : undefined;
      await adminApi.suspendProvider(id!, payload);
      setShowSuspendModal(false);
      toast.success("Provider account has been deactivated/suspended.");
      await fetchProviderDetails(id!);
    } catch (err: any) {
      console.error("Suspend error:", err);
      toast.error(err?.response?.data?.message || "Failed to suspend provider.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickUnsuspend = async () => {
    try {
      setSubmitting(true);
      await adminApi.unsuspendProvider(id!);
      toast.success("Account status reactivated!");
      await fetchProviderDetails(id!);
    } catch (err: any) {
      console.error("Unsuspend error:", err);
      toast.error(err?.response?.data?.message || "Failed to reactivate provider.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSubmitting(true);
      await adminApi.updateProvider(id!, {
        business_name: editForm.businessName,
        phone: editForm.phone,
        status: editForm.status,
      });
      setShowEditModal(false);
      toast.success("Provider details saved successfully.");
      await fetchProviderDetails(id!);
    } catch (err: any) {
      console.error("Save edit error:", err);
      toast.error(err?.response?.data?.message || "Failed to update provider profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const providerId = provider?.id || id;
  const fullName = String(
    provider?.user?.full_name ||
      `${provider?.user?.first_name || ""} ${provider?.user?.last_name || ""}`.trim() ||
      provider?.fullName ||
      provider?.name ||
      "Provider Owner"
  );
  const businessName = String(provider?.business_name || provider?.name || fullName);
  const email = String(provider?.user?.email || provider?.email || "—");
  const phone = String(provider?.user?.phone || provider?.phone || "—");
  const rawCat = provider?.category;
  const categoryName = typeof rawCat === "object" ? (rawCat?.name || "General Service") : String(rawCat || "General Service");
  const emailVerified = provider?.user?.email_verified !== false && provider?.emailVerified !== false;
  const dbStatus = String(provider?.status || "").toLowerCase();
  const dbVerified = String(provider?.verified || "").toLowerCase();

  const isVerified = dbVerified === "verified" || dbVerified === "approved";
  const isRejected = dbVerified === "rejected" || dbStatus === "rejected";
  const isSuspended = dbStatus === "paused" || dbStatus === "suspended";

  const licenseDocUrl = resolveMediaUrl(
    provider?.license_document_url || provider?.license_document || provider?.licenseDocumentUrl
  );
  const insuranceDocUrl = resolveMediaUrl(
    provider?.insurance_certificate_url || provider?.insurance_certificate || provider?.insuranceCertificateUrl
  );

  const offeredServices = parseJson<string[]>(provider?.offered_services, []);
  const servicePricing = parseJson<Record<string, any>>(provider?.service_pricing, {});
  const portfolio = parseJson<Array<{ url?: string; image?: string; caption?: string }>>(provider?.portfolio, []);
  const faqs = parseJson<Array<{ question: string; answer: string }>>(provider?.faqs, []);
  const certifications = parseJson<string[]>(provider?.certifications, []);

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
      : Array.isArray(provider?.services) && provider.services.length > 0
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

  const experienceYears = Number(provider?.years_of_experience || 0);
  const displayYears = experienceYears > 70 ? "Not specified" : `${experienceYears} Years`;

  const rawAvailabilities = Array.isArray(provider?.availabilities) ? provider.availabilities : [];
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

  return {
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
  };
}
