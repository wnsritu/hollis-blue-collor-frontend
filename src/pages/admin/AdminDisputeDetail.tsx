import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle, DollarSign, CreditCard, Send, Eye, ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminFinalDisputeDecision, getDisputeData } from "@/services/support";

const AdminDisputeDetail = () => {
  const { id } = useParams();
  const [disputeData, setDisputeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [partialRefundOpen, setPartialRefundOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialNotes, setPartialNotes] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const fetchDispute = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await getDisputeData(id);
      if (res?.data?.success) {
        const rawData = res.data.data;
        setDisputeData(rawData);
        const disputeObj = rawData?.dispute || rawData;
        const totalAmt = disputeObj?.booking?.total_amount || disputeObj?.refund_requested || disputeObj?.total_amount || "";
        setPartialAmount(totalAmt ? String(totalAmt) : "");
      } else {
        toast.error("Failed to load dispute details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while fetching dispute");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
        <p className="text-sm font-medium">Loading dispute details...</p>
      </div>
    );
  }

  if (!disputeData) {
    return (
      <div className="text-center py-16 px-4 space-y-4">
        <ShieldAlert size={48} className="mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Dispute Not Found</h3>
        <Link to="/admin/disputes">
          <Button variant="outline" size="sm">Back to Disputes</Button>
        </Link>
      </div>
    );
  }

  // Safe extraction of dispute object whether API returned { dispute, evidences } or direct dispute object
  const dispute = disputeData?.dispute || disputeData;
  const evidences: any[] = disputeData?.evidences || dispute?.evidences || [];

  const disputeId = dispute?.id || id;
  const bookingNumber = dispute?.booking?.booking_number || (dispute?.booking_id ? `BK-${dispute.booking_id}` : "-");
  const customerName = dispute?.customer?.full_name || dispute?.customer_name || "Customer";
  const customerEmail = dispute?.customer?.email;
  const providerName = dispute?.booking?.provider?.business_name || dispute?.provider_name || "Provider";
  const issueType = dispute?.issue_type ? dispute.issue_type.replace(/_/g, " ") : "-";
  const description = dispute?.description || dispute?.customer_description || "No description provided.";
  const agentName = dispute?.assignedAgent?.full_name || dispute?.agent_name || "Unassigned";
  const status = (dispute?.status || "open").toLowerCase();
  const adminDecision = dispute?.admin_decision || "pending";
  const resolutionNote = dispute?.admin_resolution_note || dispute?.agent_description;

  const isDisabled = status === "resolved" || status === "rejected";

  const handleDecision = async (type: string) => {
    setLoading(true);
    try {
      const req = {
        dispute_id: Number(disputeId),
        decision: type,
        status: type === "reject_dispute" ? "rejected" : "resolved",
      };
      const res: any = await adminFinalDisputeDecision(req);
      if (res?.data?.success) {
        toast.success(res.data.message || "Decision submitted successfully");
        fetchDispute();
      } else {        
        toast.error(res?.data?.message || "Failed to submit decision");
      }
    } catch (err: any) {      
      toast.error(err?.response?.data?.message || "Something went wrong submitting decision");
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionPartial = async () => {
    if (!partialAmount || Number(partialAmount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    setLoading(true);
    try {
      const req = {
        dispute_id: Number(disputeId),
        decision: "partial_refund",
        status: "resolved",
        refund_amount: Number(partialAmount),
        admin_note: partialNotes || "Partial refund issued by admin",
      };
      const res: any = await adminFinalDisputeDecision(req);      
      if (res?.data?.success) {
        toast.success(res.data.message || "Partial refund issued successfully");
        setPartialRefundOpen(false);
        fetchDispute();
      } else {
        toast.error(res?.data?.message || "Failed to issue partial refund");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Something went wrong issuing partial refund");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "open":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Open</Badge>;
      case "under_review":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Under Review</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>;
      case "rejected":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200 capitalize">{st}</Badge>;
    }
  };

  const buildImageUrl = (rawUrl: string) => {
    if (!rawUrl) return "";
    const clean = rawUrl.replace(/"/g, "").trim();
    if (clean.startsWith("http")) return clean;
    return `${BASE_URL}${clean.startsWith("/") ? "" : "/"}${clean}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin/disputes" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Disputes
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            Dispute DSP-{disputeId}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
          {adminDecision && adminDecision !== "pending" && (
            <Badge variant="outline" className="capitalize bg-purple-50 text-purple-700 border-purple-200">
              Decision: {adminDecision.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </div>

      {/* Dispute Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Booking / Order</p>
              <p className="font-semibold text-foreground font-mono text-base">{bookingNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Customer</p>
              <p className="font-semibold text-foreground">{customerName}</p>
              {customerEmail && <p className="text-xs text-muted-foreground">{customerEmail}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Provider</p>
              <p className="font-semibold text-foreground">{providerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Issue Type</p>
              <p className="font-semibold text-foreground capitalize">{issueType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={18} className="text-destructive" /> Issue Details & Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-accent/50 p-4 border border-border/50">
            <p className="text-xs font-medium text-foreground mb-1">Customer Statement</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Evidence */}
      {evidences.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Uploaded Evidence ({evidences.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {evidences.map((img: any, i: number) => {
                const rawUrl = img.file_url || img.image_url || "";
                const fullUrl = buildImageUrl(rawUrl);
                return (
                  <button
                    key={img.id || i}
                    onClick={() => setPreviewImage(fullUrl)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors bg-muted"
                  >
                    <img src={fullUrl} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Agent Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Support Agent Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-accent/40 p-4 space-y-2 border border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Agent: {agentName}</p>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                {status === "open" ? "Pending Agent" : "Assigned"}
              </Badge>
            </div>
            {resolutionNote && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <p className="text-xs font-medium text-foreground">Resolution Notes / Recommendation:</p>
                <p className="text-sm text-muted-foreground">{resolutionNote}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Final Decision */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Admin Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isDisabled
              ? `This dispute has been marked as ${status}.`
              : "Review all evidence and select a final decision to resolve or close this dispute."}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={isDisabled || loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setPartialRefundOpen(true)}
            >
              <CreditCard size={16} className="mr-1.5" /> Issue Partial Refund
            </Button>

            <Button
              disabled={isDisabled || loading}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => handleDecision("refund")}
            >
              <DollarSign size={16} className="mr-1.5" /> Issue Full Refund
            </Button>

            <Button
              disabled={isDisabled || loading}
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleDecision("release_payment")}
            >
              <Send size={16} className="mr-1.5" /> Release Payment to Provider
            </Button>

            <Button
              disabled={isDisabled || loading}
              variant="destructive"
              onClick={() => handleDecision("reject_dispute")}
            >
              Reject Dispute
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partial Refund Modal */}
      <Dialog open={partialRefundOpen} onOpenChange={setPartialRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Partial Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Refund Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Reason for partial refund..."
                value={partialNotes}
                onChange={(e) => setPartialNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartialRefundOpen(false)}>Cancel</Button>
            <Button onClick={handleDecisionPartial} disabled={loading}>Confirm Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evidence Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Evidence Preview"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputeDetail;