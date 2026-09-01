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
  AlertTriangle, DollarSign, CreditCard, Send, CheckCircle, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminFinalDisputeDecision, getDisputeData } from "@/api/dispute.api";

const AdminDisputeDetail = () => {
  const { id } = useParams();
  const [disputeData, setDisputeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [partialRefundOpen, setPartialRefundOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [partialNotes, setPartialNotes] = useState("");
  const [decision, setDecision] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;


  const fetchDispute = async () => {
    setLoading(true);
    try {
      const res = await getDisputeData({"booking_id": id});
      if (res?.data?.success) {
        setDisputeData(res.data.data);
        setPartialAmount(res.data.data.dispute.total_amount);
      } else {
        toast.error("Failed to load dispute");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Fetch dispute by ID
  useEffect(() => {
    fetchDispute();
  }, [id]);

  const handleDecision = async (type: any, id: any) => {
    setLoading(true);
    try {
      let req = {
        "dispute_id": id,
        "decision": type,
      };
      const res = await adminFinalDisputeDecision(req);
      if (res?.data?.success) {
        toast.success(res.data.message || "Decision submitted successfully");
        fetchDispute();
      } else {        
        toast.error(res.data.message || "Failed to load dispute");
      }
    } catch (err) {      
      toast.error(err || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionPartial = async (type: any, notes: string, amount: any, id: any) => {
    setLoading(true);
    try {
      let req = {
        "dispute_id": id,
        "decision": type,
        "refund_amount": amount,
        "admin_note": notes,
      };
      const res = await adminFinalDisputeDecision(req);      
      if (res?.data?.success) {
        toast.success(res.data.message || "Partial refund issued successfully");
        setPartialRefundOpen(false);
        fetchDispute();
      } else {
        toast.error("Failed to load dispute");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !disputeData) {
    return <p className="text-center py-10 text-muted-foreground">Loading dispute details...</p>;
  }

  const { dispute, evidences, timeline } = disputeData;

  const isDisabled = disputeData?.dispute?.status === "resolved";

  const statusColors = {
    open: "bg-red-100 text-red-600",
    resolved: "bg-green-100 text-green-600",
  };

  const getDisabledMessage = (adminDecision) => {
    // debugger
    if (!adminDecision) return "";
    return "Action already performed by admin"; // ✅ single generic message
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin/disputes" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Disputes
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dispute {dispute.id}</h1>
        </div>
        <Badge className={`w-fit border-0 ${decision ? "bg-secondary/10 text-secondary" : statusColors[dispute.status]}`}>
          {decision ? "Resolved" : dispute.status}
        </Badge>
      </div>

      {/* Dispute Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-muted-foreground">Order</p><p className="font-medium text-foreground">ORD-{dispute?.booking_id}</p></div>
            <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-foreground">{dispute?.customer_name}</p></div>
            <div><p className="text-muted-foreground">Provider</p><p className="font-medium text-foreground">{dispute?.provider_name}</p></div>
            <div><p className="text-muted-foreground">Issue Type</p><p className="font-medium text-foreground">{dispute?.issue_type.replace("_", " ")}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" /> Issue Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-accent p-3">
            <p className="text-xs font-medium text-foreground mb-1">Customer Comment</p>
            <p className="text-sm text-muted-foreground">{dispute?.customer_description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Evidence */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Evidence</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {evidences.map((img, i) => (
              <button key={img.id} onClick={() => setPreviewImage(img.image_url.replace(/"/g, ""))} className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                <img src={`${BASE_URL}${img?.image_url.replace(/"/g, "")}`} alt={`Evidence ${i+1}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support Agent Recommendation */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Support Agent Recommendation</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg bg-accent p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{dispute?.agent_name}</p>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">{dispute?.agent_recommendation || "Agent Recomended"}</Badge>
            </div>
            {/* <p className="text-sm text-muted-foreground">{dispute?.recommendation}</p> */}
            <p className="text-sm text-muted-foreground">{dispute?.agent_description}</p>
            {/* <p className="text-xs text-muted-foreground">{dispute?.date}</p> */}
          </div>
        </CardContent>
      </Card>

      {/* Admin Final Decision */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Final Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Review all evidence and make a final decision on this dispute.</Label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={isDisabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setPartialRefundOpen(true)}>
              <CreditCard size={14} className="mr-1" /> Issue Partial Refund
            </Button>
            <Button disabled={isDisabled} onClick={() => handleDecision("refund", dispute?.id)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <DollarSign size={14} className="mr-1" /> Issue Full Refund
            </Button>
            <Button disabled={isDisabled} className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleDecision("release_payment", dispute?.id)}>
              <Send size={14} className="mr-1" /> Release Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partial Refund Modal */}
      <Dialog open={partialRefundOpen} onOpenChange={setPartialRefundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Partial Refund</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Refund Amount ($)</Label>
              <Input type="number" step="0.01" min="0" max={partialAmount} placeholder="0.00" value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Reason for partial refund..." value={partialNotes} onChange={(e) => setPartialNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartialRefundOpen(false)}>Cancel</Button>
            <Button onClick={() => handleDecisionPartial("partial_refund", partialNotes || "Partial refund issued.", partialAmount, dispute?.id)}>Confirm</Button>
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
              src={`${BASE_URL}${previewImage.replace(/"/g, "")}`}
              alt="Evidence"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputeDetail;