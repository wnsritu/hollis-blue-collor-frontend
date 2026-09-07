import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { catalogApi } from "@/api/modules/catalog.api";
import { projectApi } from "@/api/modules/project.api";
import type { Category, ServiceType } from "@/types/api/catalog";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: number) => void;
  initialCategoryId?: number;
  initialServiceTypeId?: number;
  providerId?: number;
  providerName?: string;
  categoryName?: string;
  subCategoryName?: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onOpenChange,
  onProjectCreated,
  initialCategoryId,
  initialServiceTypeId,
  providerId,
  providerName,
  categoryName,
  subCategoryName,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>(
    initialCategoryId ? String(initialCategoryId) : ""
  );
  const [serviceTypeId, setServiceTypeId] = useState<string>(
    initialServiceTypeId ? String(initialServiceTypeId) : ""
  );
  const [description, setDescription] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [urgency, setUrgency] = useState<"flexible" | "soon" | "urgent">("soon");
  const [preferredDate, setPreferredDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const res = await catalogApi.getTree();
        if (!cancelled) {
          const list = (res as any)?.data || [];
          setCategories(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to load catalog tree", err);
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (initialCategoryId) setCategoryId(String(initialCategoryId));
    if (initialServiceTypeId) setServiceTypeId(String(initialServiceTypeId));
  }, [initialCategoryId, initialServiceTypeId]);

  const selectedCategory = categories.find(
    (c) => String(c.id) === categoryId
  );
  const serviceTypes: ServiceType[] = selectedCategory?.service_types || [];

  const isFixedCategory = Boolean(initialCategoryId || providerId);
  const displayCategoryName = categoryName || selectedCategory?.name || "";
  const displaySubCategoryName =
    subCategoryName ||
    serviceTypes.find((s) => String(s.id) === serviceTypeId)?.name ||
    "";

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a project description.");
      return;
    }
    if (!addressLine.trim()) {
      toast.error("Please provide a service location address.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category_id: Number(categoryId),
        service_type_id: serviceTypeId ? Number(serviceTypeId) : undefined,
        invited_provider_id: providerId ? Number(providerId) : undefined,
        request_type: providerId ? ("direct_quote" as const) : ("open_match" as const),
        description: description.trim(),
        address_line: addressLine.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip_code: zipCode.trim() || undefined,
        budget_min: budgetMin ? Number(budgetMin) : undefined,
        budget_max: budgetMax ? Number(budgetMax) : undefined,
        urgency,
        preferred_date: preferredDate || undefined,
        status: "open" as const,
      };

      const res = await projectApi.create(payload as any);
      const createdProject = (res as any)?.data || res;
      const projectId = createdProject?.id;

      // Upload attachments if any
      if (projectId && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("attachment", file);
          try {
            await projectApi.addAttachment(projectId, formData);
          } catch (uploadErr) {
            console.error("Failed to upload attachment", uploadErr);
          }
        }
      }

      toast.success(
        providerId
          ? "Quote request sent! The professional has been notified."
          : "Project posted successfully! Providers are being matched to your request."
      );
      onOpenChange(false);
      if (onProjectCreated && projectId) {
        onProjectCreated(projectId);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {providerName ? `Request a Quote from ${providerName}` : "Post a Project & Get Custom Proposals"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {providerName
              ? "Describe your project details and budget. The professional will receive your request directly."
              : "Describe what you need, set your budget, and matched verified local professionals will send you quotes."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-medium">
              Project Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Leaking pipe repair in master bathroom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Service Type (Fixed Banner or Interactive Select) */}
          {isFixedCategory ? (
            <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-semibold">
                  {providerName ? `Direct Request to ${providerName}` : "Fixed Category"}
                </p>
                <h4 className="text-sm font-extrabold text-foreground">
                  {displayCategoryName || "Service Category"} {displaySubCategoryName ? `• ${displaySubCategoryName}` : ""}
                </h4>
              </div>
              <span className="rounded-full bg-primary/10 text-primary font-bold text-xs px-3 py-1 shrink-0">
                Pre-selected
              </span>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={(val) => {
                  setCategoryId(val);
                  setServiceTypeId("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCatalog ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium">Specific Sub-Category / Service</Label>
                <Select
                  value={serviceTypeId}
                  onValueChange={setServiceTypeId}
                  disabled={!categoryId || serviceTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !categoryId
                          ? "Select category first"
                          : serviceTypes.length === 0
                          ? "No specific sub-category"
                          : "Select sub-category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((st) => (
                      <SelectItem key={st.id} value={String(st.id)}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="font-medium">
              Description & Details <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="desc"
              rows={4}
              placeholder="Describe the issue, work scope, size, or any specific requirements for the pro..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Address & Location */}
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
            <h4 className="text-sm font-semibold">Service Location</h4>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs">
                Street Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="123 Main St, Apt 4B"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input
                  id="city"
                  placeholder="Austin"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs">State</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip" className="text-xs">Zip Code</Label>
                <Input
                  id="zip"
                  placeholder="78701"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Budget, Urgency & Date */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estimated Budget ($)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Urgency</Label>
              <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible timing</SelectItem>
                  <SelectItem value="soon">Within next few days</SelectItem>
                  <SelectItem value="urgent">Urgent / Immediate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prefDate" className="text-xs font-medium">
                Preferred Date
              </Label>
              <Input
                id="prefDate"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments / Photos (Optional)</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-medium hover:border-primary hover:bg-primary-soft/10">
                <Upload size={14} className="text-primary" />
                <span>Upload file(s)</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileAdd}
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
              {files.map((file, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs"
                >
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
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
                  <Loader2 size={15} className="mr-2 animate-spin" /> Posting...
                </>
              ) : (
                "Post Project & Find Pros"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
