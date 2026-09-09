import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "@/services/admin";

export function getCategoryName(cat: any): string {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat.name || cat.title || cat.label || "General";
  return String(cat);
}

export function getSubscriptionPlan(sub: any): string {
  if (!sub) return "Pro Unlimited";
  if (typeof sub === "string") return sub;
  if (typeof sub === "object") return sub.name || sub.title || sub.plan || "Pro Unlimited";
  return String(sub);
}

export function useAdminProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [showVerifySuccessModal, setShowVerifySuccessModal] = useState(false);
  const [verifiedProviderName, setVerifiedProviderName] = useState("");

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [targetRejectProvider, setTargetRejectProvider] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Suspend Modal State
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [targetSuspendProvider, setTargetSuspendProvider] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchProviders(currentPage);
  }, [currentPage]);

  const fetchProviders = async (page = 1) => {
    try {
      setLoading(true);
      const res: any = await adminApi.listProviders({ page, limit: 10 });

      const payload = res?.data?.data || res?.data || res;
      const list = Array.isArray(payload) ? payload : (payload?.items || payload?.providers || []);
      const total = payload?.pagination?.total || payload?.total || list.length;
      const pages = payload?.pagination?.totalPages || payload?.totalPages || Math.ceil(total / 10) || 1;

      setProviders(list);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err: any) {
      console.error("Error fetching providers:", err);
      toast.error("Failed to load provider list from server.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Approve Action
  const handleQuickApprove = async (providerId: string | number, name: string) => {
    try {
      setSubmittingAction(true);
      await adminApi.approveProvider(providerId);
      setVerifiedProviderName(name);
      setShowVerifySuccessModal(true);
      toast.success(`${name} verified successfully.`);
      await fetchProviders(currentPage);
    } catch (err: any) {
      console.error("Quick verify error:", err);
      toast.error(err?.response?.data?.message || "Verification action failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (provider: any) => {
    setTargetRejectProvider(provider);
    setRejectionReason("");
    setRejectionError("");
    setShowRejectModal(true);
  };

  // Confirm Rejection API
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

    if (!targetRejectProvider) return;

    try {
      setSubmittingAction(true);
      await adminApi.rejectProvider(targetRejectProvider.id, { reason: trimmedReason });
      setShowRejectModal(false);
      toast.error(`Provider application for ${targetRejectProvider.business_name || targetRejectProvider.name} rejected.`);
      await fetchProviders(currentPage);
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast.error(err?.response?.data?.message || "Failed to reject provider.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Open Suspend Modal
  const handleOpenSuspendModal = (provider: any) => {
    setTargetSuspendProvider(provider);
    setSuspendReason("");
    setShowSuspendModal(true);
  };

  // Confirm Suspend API
  const handleConfirmSuspend = async () => {
    if (!targetSuspendProvider) return;
    try {
      setSubmittingAction(true);
      const payload = suspendReason.trim() ? { reason: suspendReason.trim() } : undefined;
      await adminApi.suspendProvider(targetSuspendProvider.id, payload);
      setShowSuspendModal(false);
      toast.success(`${targetSuspendProvider.business_name || targetSuspendProvider.name} has been inactivated.`);
      await fetchProviders(currentPage);
    } catch (err: any) {
      console.error("Suspend error:", err);
      toast.error(err?.response?.data?.message || "Failed to suspend provider.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Quick Unsuspend API
  const handleQuickUnsuspend = async (providerId: string | number, name: string) => {
    try {
      setSubmittingAction(true);
      await adminApi.unsuspendProvider(providerId);
      toast.success(`Account activated for ${name}.`);
      await fetchProviders(currentPage);
    } catch (err: any) {
      console.error("Unsuspend error:", err);
      toast.error(err?.response?.data?.message || "Failed to activate provider.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filtered = providers.filter((p) => {
    const dbStatus = String(p.status || "").toLowerCase();
    const dbVerified = String(p.verified || "").toLowerCase();

    const isVerified = dbVerified === "verified" || dbVerified === "approved";
    const isRejected = dbVerified === "rejected" || dbStatus === "rejected";
    const isSuspended = dbStatus === "paused" || dbStatus === "suspended";
    const isPending = !isVerified && !isRejected && !isSuspended;

    // Filter matching
    if (statusFilter === "Pending" && !isPending) return false;
    if (statusFilter === "Active" && !isVerified) return false;
    if (statusFilter === "Suspended" && !isSuspended) return false;
    if (statusFilter === "Rejected" && !isRejected) return false;

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const busName = String(p.business_name || p.name || "").toLowerCase();
      const ownerName = String(`${p.user?.first_name || ""} ${p.user?.last_name || ""}`).toLowerCase();
      const cat = getCategoryName(p.category || p.subcategory).toLowerCase();
      const loc = `${p.city || ""} ${p.state || ""}`.toLowerCase();

      return busName.includes(q) || ownerName.includes(q) || cat.includes(q) || loc.includes(q);
    }

    return true;
  });

  return {
    providers,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    showVerifySuccessModal,
    setShowVerifySuccessModal,
    verifiedProviderName,
    showRejectModal,
    setShowRejectModal,
    targetRejectProvider,
    rejectionReason,
    setRejectionReason,
    rejectionError,
    showSuspendModal,
    setShowSuspendModal,
    targetSuspendProvider,
    suspendReason,
    setSuspendReason,
    submittingAction,
    handleQuickApprove,
    handleOpenRejectModal,
    handleConfirmReject,
    handleOpenSuspendModal,
    handleConfirmSuspend,
    handleQuickUnsuspend,
    filtered,
    fetchProviders,
  };
}
