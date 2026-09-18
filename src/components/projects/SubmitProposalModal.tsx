import React from "react";
import { useFormik } from "formik";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { proposalApi } from "@/services/project";
import {
  proposalSubmissionValidationSchema,
  type ProposalSubmissionFormValues,
  type ProposalLineItem,
} from "@/validations/proposal";

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
  const formik = useFormik<ProposalSubmissionFormValues>({
    initialValues: {
      message: "",
      estimatedHours: "",
      proposedDate: "",
      validDays: "7",
      lineItems: [{ description: "Labor & Service", quantity: 1, unit_price: 150 }],
    },
    validationSchema: proposalSubmissionValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const totalAmount = values.lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
        0
      );

      if (totalAmount <= 0) {
        toast.error("Proposal total amount must be greater than $0.");
        return;
      }

      setSubmitting(true);
      try {
        const validUntilDate = new Date();
        validUntilDate.setDate(validUntilDate.getDate() + (Number(values.validDays) || 7));

        const payload = {
          amount: totalAmount,
          currency: "usd",
          message: values.message.trim(),
          estimated_duration_hours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
          proposed_date: values.proposedDate || undefined,
          valid_until: validUntilDate.toISOString(),
          line_items: values.lineItems.map((item) => ({
            description: item.description || "Service item",
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
          })),
        };

        await proposalApi.createForProject(projectId, payload as any);

        toast.success("Proposal submitted successfully!");
        resetForm();
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
    },
  });

  const handleAddLineItem = () => {
    formik.setFieldValue("lineItems", [
      ...formik.values.lineItems,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (formik.values.lineItems.length <= 1) return;
    formik.setFieldValue(
      "lineItems",
      formik.values.lineItems.filter((_, i) => i !== index)
    );
  };

  const handleLineItemChange = (
    index: number,
    field: keyof ProposalLineItem,
    val: any
  ) => {
    const copy = [...formik.values.lineItems];
    copy[index] = {
      ...copy[index],
      [field]: field === "description" ? val : Number(val) || 0,
    };
    formik.setFieldValue("lineItems", copy);
  };

  const calculateTotal = () => {
    return formik.values.lineItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      0
    );
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

        <form onSubmit={formik.handleSubmit} className="mt-4 space-y-5">
          {/* Work Message / Scope */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="msg" className="font-medium">
                Proposal Message & Work Plan <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-[11px] ${
                  formik.values.message.length > 1900
                    ? "text-amber-500 font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {formik.values.message.length} / 2000 characters
              </span>
            </div>
            <Textarea
              id="msg"
              name="message"
              rows={4}
              placeholder="Explain how you will complete the project, your qualifications, and what's included (min 10 characters)..."
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.message && formik.errors.message
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {formik.touched.message && formik.errors.message && (
              <p className="text-xs font-medium text-destructive mt-1">
                {formik.errors.message}
              </p>
            )}
            {formik.values.message.length > 0 && formik.values.message.length < 10 && (
              <p className="text-[11px] text-amber-500 font-medium">
                Please enter at least {10 - formik.values.message.length} more character(s).
              </p>
            )}
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
              {formik.values.lineItems.map((item, idx) => (
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
                    disabled={formik.values.lineItems.length <= 1}
                    className="grid size-8 place-items-center text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {typeof formik.errors.lineItems === "string" && (
              <p className="text-xs font-medium text-destructive mt-1">
                {formik.errors.lineItems}
              </p>
            )}

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
                name="estimatedHours"
                type="number"
                placeholder="2"
                value={formik.values.estimatedHours}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={
                  formik.touched.estimatedHours && formik.errors.estimatedHours
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {formik.touched.estimatedHours && formik.errors.estimatedHours && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formik.errors.estimatedHours}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="propDate" className="text-xs font-medium">
                Proposed Start Date
              </Label>
              <Input
                id="propDate"
                name="proposedDate"
                type="date"
                value={formik.values.proposedDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valDays" className="text-xs font-medium">
                Quote Valid For (Days) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valDays"
                name="validDays"
                type="number"
                min={1}
                max={90}
                value={formik.values.validDays}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={
                  formik.touched.validDays && formik.errors.validDays
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {formik.touched.validDays && formik.errors.validDays && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formik.errors.validDays}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formik.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
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
