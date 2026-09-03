import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/shared/primitives";
import PaginationController from "@/components/ui/PaginationController";
import Spinner from "@/components/ui/spinner";
import { adminApi } from "@/api/modules/admin.api";

function getCategoryName(cat: any): string {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat.name || cat.title || cat.label || "General";
  return String(cat);
}

function getSubscriptionPlan(sub: any): string {
  if (!sub) return "Pro Unlimited";
  if (typeof sub === "string") return sub;
  if (typeof sub === "object") return sub.name || sub.title || sub.plan || "Pro Unlimited";
  return String(sub);
}

export function AdminProviders() {
  const navigate = useNavigate();
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <PageHeader title="Providers" subtitle={`${totalCount || providers.length} provider accounts`} />

      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search providers…"
              className="pl-9 bg-card border-border"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending Review</SelectItem>
              <SelectItem value="Active">Active (Verified)</SelectItem>
              <SelectItem value="Suspended">Suspended (Paused)</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business &amp; Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[130px]">Location</TableHead>
              <TableHead>Email Verification</TableHead>
              <TableHead>Provider Verification</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <Spinner />
                  <p className="mt-2 text-xs text-muted-foreground">Loading provider directory...</p>
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((p) => {
                const pId = p.id;
                const busName = String(p.business_name || p.name || "Provider");
                const ownerName = String(`${p.user?.first_name || ""} ${p.user?.last_name || ""}`.trim() || p.fullName || busName);
                const category = getCategoryName(p.category || p.subcategory);
                const location = [p.city, p.state].filter(Boolean).join(", ") || "Austin, TX";
                const fullLocation = [p.service_location_address, p.city, p.state, p.zip_code || p.zip, p.country].filter(Boolean).join(", ") || location;
                const emailVerified = p.user?.email_verified !== false && p.emailVerified !== false;
                const dbStatus = String(p.status || "").toLowerCase();
                const dbVerified = String(p.verified || "").toLowerCase();

                const isVerified = dbVerified === "verified" || dbVerified === "approved";
                const isRejected = dbVerified === "rejected" || dbStatus === "rejected";
                const isSuspended = dbStatus === "paused" || dbStatus === "suspended";
                const isPending = !isVerified && !isRejected && !isSuspended;

                const subPlan = getSubscriptionPlan(p.subscription || p.plan);

                return (
                  <TableRow key={pId}>
                    <TableCell className="font-medium">
                      <Link to={`/admin/providers/${pId}`} className="font-bold hover:text-primary block text-foreground">
                        {busName}
                      </Link>
                      <span className="text-xs text-muted-foreground">{ownerName}</span>
                    </TableCell>
                    <TableCell>{category}</TableCell>
                    <TableCell className="max-w-[130px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate cursor-help text-muted-foreground hover:text-foreground transition-colors">
                            {location}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-medium">
                          {fullLocation}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {emailVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-soft text-warning">
                          <AlertTriangle size={12} /> Pending
                        </span>
                      )}
                    </TableCell>
                    
                    {/* PROVIDER VERIFICATION PILL (MATCHING EMAIL VERIFICATION STYLING EXACTLY) */}
                    <TableCell>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                          <XCircle size={12} /> Rejected
                        </span>
                      ) : isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700">
                          <PauseCircle size={12} /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-soft text-warning">
                          <AlertTriangle size={12} /> Pending
                        </span>
                      )}
                    </TableCell>

                    {/* NEW COLUMN: ACCOUNT STATUS (ACTIVE / INACTIVE) */}
                    <TableCell>
                      {!isSuspended && dbStatus !== "inactive" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700">
                          <PauseCircle size={12} /> Inactive
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-xs text-foreground">{subPlan}</span>
                    </TableCell>

                    {/* THREE-DOT DROPDOWN MENU FOR ACTIONS */}
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {/* 1. View Details */}
                          <DropdownMenuItem onClick={() => navigate(`/admin/providers/${pId}`)}>
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View Details
                          </DropdownMenuItem>

                          {/* 2. Approve Provider (Shown if not verified) */}
                          {!isVerified && (
                            <DropdownMenuItem onClick={() => handleQuickApprove(pId, busName)} className="text-success font-medium">
                              <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> {isRejected ? "Re-verify Provider" : "Approve Provider"}
                            </DropdownMenuItem>
                          )}

                          {/* 3. Reject Provider (Shown ONLY if pending - removed once verified!) */}
                          {isPending && (
                            <DropdownMenuItem onClick={() => handleOpenRejectModal(p)} className="text-destructive font-medium">
                              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Reject Provider
                            </DropdownMenuItem>
                          )}

                          {/* 4. Active / Inactive Option */}
                          <DropdownMenuSeparator />
                          {isSuspended || dbStatus === "inactive" ? (
                            <DropdownMenuItem onClick={() => handleQuickUnsuspend(pId, busName)} className="text-success font-medium">
                              <PlayCircle className="mr-2 h-4 w-4 text-success" /> Activate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleOpenSuspendModal(p)} className="text-amber-700 font-medium">
                              <PauseCircle className="mr-2 h-4 w-4 text-amber-700" /> Inactivate Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Users size={32} className="opacity-40" />
                    <p className="font-bold text-base text-foreground">No providers available</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      No provider accounts match the selected search query or status filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex justify-center">
          <PaginationController
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {/* VERIFY SUCCESS POPUP DIALOG */}
      <Dialog open={showVerifySuccessModal} onOpenChange={setShowVerifySuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 size={34} />
          </span>
          <DialogTitle className="mt-4 font-display text-xl font-bold text-foreground">
            Provider Verified &amp; Approved
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            <strong>{verifiedProviderName}</strong> has been successfully verified. An automated confirmation email was sent to the provider.
          </DialogDescription>
          <p className="text-xs font-medium text-foreground bg-muted p-3 rounded-xl mt-2">
            The provider can now login to their account and select a subscription plan.
          </p>
          <div className="mt-5">
            <Button className="w-full" onClick={() => setShowVerifySuccessModal(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* REJECT PROVIDER MODAL WITH MANDATORY REASON */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <XCircle size={20} /> Reject Provider Application
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to reject {targetRejectProvider?.business_name || targetRejectProvider?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rej_reason_list" className="text-sm font-semibold">
                Reason for rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rej_reason_list"
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
            <Button variant="destructive" onClick={handleConfirmReject} disabled={submittingAction}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUSPEND PROVIDER MODAL */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-800">
              <PauseCircle size={20} /> Suspend Provider Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Temporarily suspend {targetSuspendProvider?.business_name || targetSuspendProvider?.name} from accepting new service bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="sus_reason_list" className="text-xs font-semibold">Reason for Suspension (optional)</Label>
            <Textarea
              id="sus_reason_list"
              rows={3}
              placeholder="Enter optional reason for suspending this provider..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmSuspend} disabled={submittingAction}>
              Confirm Suspension
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}

export default AdminProviders;
