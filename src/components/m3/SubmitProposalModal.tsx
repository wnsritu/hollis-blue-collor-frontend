import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { proposalApi } from "@/api/modules/proposal.api";

interface LineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

interface SubmitProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectTitle: string;
  onProposalSubmitted?: () => void;
}

export const SubmitProposalModal: React.FC<SubmitProposalModalProps> = ({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  onProposalSubmitted,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [validDays, setValidDays] = useState("7");

  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    { description: "Labor & Service", quantity: 1, unit_price: 150 },
  ]);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItemInput,
    val: any
  ) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === "description" ? val : Number(val) || 0,
      };
      return copy;
    });
  };

  const calculateTotal = () => {
    return lineItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a description/message for your proposal.");
      return;
    }
    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      toast.error("Proposal total amount must be greater than $0.");
      return;
    }

    setSubmitting(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + (Number(validDays) || 7));

      const payload = {
        amount: totalAmount,
        currency: "usd",
        message: message.trim(),
        estimated_duration_hours: estimatedHours ? Number(estimatedHours) : undefined,
        proposed_date: proposedDate || undefined,
        valid_until: validUntilDate.toISOString(),
        line_items: lineItems.map((item) => ({
          description: item.description || "Service item",
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.unit_price) || 0,
        })),
      };

      await proposalApi.createForProject(projectId, payload as any);

      toast.success("Proposal submitted successfully!");
      onOpenChange(false);
      if (onProposalSubmitted) {
        onProposalSubmitted();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to submit proposal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Submit Proposal for Quote
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            Project: <span className="font-semibold text-foreground">{projectTitle}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Work Message / Scope */}
          <div className="space-y-1.5">
            <Label htmlFor="msg" className="font-medium">
              Proposal Message & Work Plan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="msg"
              rows={4}
              placeholder="Explain how you will complete the project, your qualifications, and what's included..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          {/* Itemized Line Items */}
          <div className="space-y-3 rounded-2xl border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">Itemized Line Items</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={handleAddLineItem}
              >
                <Plus size={14} /> Add Line Item
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_80px_100px_32px] items-center gap-2 rounded-xl border border-border bg-card p-2.5"
                >
                  <Input
                    placeholder="Description (e.g. Labor, Parts)"
                    value={item.description}
                    onChange={(e) =>
                      handleLineItemChange(idx, "description", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(idx, "quantity", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleLineItemChange(idx, "unit_price", e.target.value)
                      }
                      className="h-8 pl-6 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLineItem(idx)}
                    disabled={lineItems.length <= 1}
                    className="grid size-8 place-items-center text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-sm font-bold border-t border-border">
              <span>Total Estimated Amount:</span>
              <span className="font-display text-base text-primary">
                ${calculateTotal().toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Logistics & Validity */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="estHours" className="text-xs font-medium">
                Est. Duration (Hours)
              </Label>
              <Input
                id="estHours"
                type="number"
                placeholder="2"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="propDate" className="text-xs font-medium">
                Proposed Start Date
              </Label>
              <Input
                id="propDate"
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valDays" className="text-xs font-medium">
                Quote Valid For (Days)
              </Label>
              <Input
                id="valDays"
                type="number"
                min={1}
                max={30}
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Proposal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitProposalModal;
