import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Eye,
  Upload,
  DollarSign,
  CreditCard,
  Send,
  X,
} from "lucide-react";
import {
  addReviewByAgent,
  getDisputeByIdApi,
  getDisputeData,
} from "@/api/dispute.api";

const statusColors: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  resolved: "bg-secondary/10 text-secondary",
};

const SupportDisputeDetail = () => {
  const { id } = useParams();
  const [disputeData, setDisputeData] = useState<any>(null);
  const [recommendation, setRecommendation] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch dispute by ID
  const fetchDispute = async () => {
    try {
      const res = await getDisputeData({ booking_id: Number(id) });
      if (res?.data?.success) {
        setDisputeData(res?.data?.data);
        setRecommendation(res?.data?.data?.dispute?.agent_description || "");
        setSelectedAction(res?.data?.data?.dispute?.agent_recommendation || "");
      } else {
        toast.error("Failed to load dispute");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [id]);

  if (!disputeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-accent rounded-xl p-12 shadow-lg">
        <h1 className="text-2xl font-extrabold text-foreground mb-4">
          🚀 Loading Dispute...
        </h1>
      </div>
    );
  }

  const dispute = disputeData.dispute;
  const isAgentReviewed = dispute.agent_recommendation !== "pending";

  // Remove quotes from image_url
  const allEvidences = (disputeData.evidences || []).map((e: any) => ({
    ...e,
    image_url: e.image_url.replace(/"/g, ""),
  }));

  // Separate evidences
  const customerEvidences = allEvidences.filter(
    (e) => e.uploaded_by === "customer",
  );
  const supportEvidences = allEvidences.filter(
    (e) => e.uploaded_by === "support",
  );
  const providerEvidences = allEvidences.filter(
    (e) => e.uploaded_by === "provider",
  );
  const adminEvidences = allEvidences.filter((e) => e.uploaded_by === "admin");

  const openPreview = (images: File[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
  };

  const ImageGrid = ({ images, label }: { images: any[]; label: string }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => openPreview(images, i)}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
            >
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${img}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30">
                <Eye
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100"
                />
              </div>
            </button>
          ))}
          {images?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No evidence uploaded
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const handleSubmitEvidence = async () => {
    if (uploadedImages?.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("dispute_id", dispute?.id || id);
      uploadedImages.forEach((file) => formData.append("evidence", file));
      formData.append("note", recommendation);
      formData.append("recommendation", selectedAction);
      // formData.append("note", uploadNotes);

      const res: any = await addReviewByAgent(formData);

      const data = await res?.data;
      if (data.success) {
        toast.success(data.message || "Evidence uploaded successfully!");
        // Clear modal state
        setUploadOpen(false);
        setUploadedImages([]);
        setUploadNotes("");
        setRecommendation("");
        // Optionally refresh dispute data
        fetchDispute();
      } else {
        toast.error(data.message || "Failed to upload evidence.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while uploading evidence.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/support-dashboard/disputes"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Back to Disputes
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Dispute {dispute.id}
          </h1>
        </div>
        <Badge
          className={`w-fit border-0 ${
            statusColors[dispute.status] || "bg-accent text-foreground"
          }`}
        >
          {dispute.status}
        </Badge>
      </div>

      {/* HEADER INFO */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Order Number</p>
              <p className="font-medium text-foreground">
                {dispute.booking_id}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium text-foreground">
                {dispute.customer_name}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Provider</p>
              <p className="font-medium text-foreground">
                {dispute.provider_name}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">
                {new Date(dispute.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ISSUE SUMMARY */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" />
            Issue Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Issue Type
            </p>
            <p className="text-sm text-foreground">{dispute.issue_type}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Description
            </p>
            <p className="text-sm text-foreground">
              {dispute.customer_description}
            </p>
          </div>

          <div className="rounded-lg bg-accent p-3">
            <p className="text-xs font-medium text-foreground mb-1">
              Customer Comment
            </p>
            <p className="text-xs text-muted-foreground">
              {dispute.customer_description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* EVIDENCE */}
      <div className="space-y-4">
        {customerEvidences?.length > 0 && (
          <ImageGrid
            images={customerEvidences.map((e) => e.image_url)}
            label="Customer Evidence"
          />
        )}

        {supportEvidences?.length > 0 && (
          <ImageGrid
            images={supportEvidences.map((e) => e.image_url)}
            label="Support Agent Evidence"
          />
        )}

        {providerEvidences?.length > 0 && (
          <ImageGrid
            images={providerEvidences.map((e) => e.image_url)}
            label="Provider Evidence"
          />
        )}

        {adminEvidences?.length > 0 && (
          <ImageGrid
            images={adminEvidences.map((e) => e.image_url)}
            label="Admin Evidence"
          />
        )}
      </div>

      {/* const isAgentReviewed = !!dispute.agent_recommendation; // true if already submitted */}

      {/* Support Agent Action */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Support Agent Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notes */}
          <div className="space-y-2">
            <Label>Recommend Action</Label>
            <Textarea
              placeholder="Write your recommendation based on the evidence..."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={4}
              readOnly={isAgentReviewed} // readonly if already reviewed
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              className={`${
                selectedAction === "refund"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-secondary/90`}
              onClick={() => setSelectedAction("refund")}
              disabled={isAgentReviewed} // disable if reviewed
            >
              <DollarSign size={14} className="mr-1" /> Recommend Refund
            </Button>

            <Button
              className={`${
                selectedAction === "partial_refund"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-secondary/90`}
              onClick={() => setSelectedAction("partial_refund")}
              disabled={isAgentReviewed}
            >
              <CreditCard size={14} className="mr-1" /> Recommend Partial Refund
            </Button>

            <Button
              className={`${
                selectedAction === "release_payment"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-secondary/90`}
              onClick={() => setSelectedAction("release_payment")}
              disabled={isAgentReviewed}
            >
              <Send size={14} className="mr-1" /> Recommend Release Payment
            </Button>
          </div>

          {/* Inline Evidence Upload */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload size={16} className="text-muted-foreground" />
                Upload Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag & Click Upload */}
              <div
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isAgentReviewed
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                    : "cursor-pointer hover:border-primary/50"
                }`}
                onClick={() =>
                  !isAgentReviewed &&
                  document.getElementById("inlineFileInput")?.click()
                }
              >
                <Upload size={28} className="mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Click or drag images to upload (Max 5)
                </p>
                <input
                  id="inlineFileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isAgentReviewed} // disable if already reviewed
                  onChange={(e) => {
                    if (e.target.files) {
                      const imgs = Array.from(e.target.files).filter((f) =>
                        f.type.startsWith("image/"),
                      );
                      setUploadedImages((prev) =>
                        [...prev, ...imgs].slice(0, 5),
                      );
                    }
                  }}
                />
              </div>

              {/* Preview all selected images */}
              {uploadedImages?.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`preview-${i}`}
                        className="h-20 w-20 object-cover rounded"
                      />
                      {!isAgentReviewed && (
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedImages((prev) =>
                              prev.filter((_, index) => index !== i),
                            )
                          }
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitEvidence}
                  disabled={
                    uploadedImages?.length === 0 || uploading || isAgentReviewed
                  }
                  // className="bg-secondary"
                >
                  {uploading
                    ? "Uploading..."
                    : isAgentReviewed
                      ? "Already Submitted"
                      : "Send to Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* IMAGE PREVIEW DIALOG */}
      <Dialog
        open={previewImages.length > 0}
        onOpenChange={() => setPreviewImages([])}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              ({previewIndex + 1} / {previewImages.length})
            </DialogTitle>
          </DialogHeader>

          {previewImages.length > 0 && (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}${previewImages[previewIndex]}`}
              className="w-full max-h-[60vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportDisputeDetail;
