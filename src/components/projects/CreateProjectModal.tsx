import React, { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import GooglePlaceAutocomplete from "@/components/ui/GooglePlaceAutocomplete";
import { parseGooglePlace } from "@/utils/googlePlaces";
import { catalogApi } from "@/services/catalog";
import { projectApi } from "@/services/project";
import type { Category, ServiceType } from "@/types/api/catalog";
import type { CreateProjectModalProps, CreateProjectFormValues } from "@/types/project.types";
import {
  DEFAULT_CREATE_PROJECT_VALUES,
  URGENCY_OPTIONS,
} from "@/constants/project.constants";
import { createProjectValidationSchema } from "@/validations/project";

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
  const [files, setFiles] = useState<File[]>([]);

  const formik = useFormik<CreateProjectFormValues>({
    initialValues: {
      ...DEFAULT_CREATE_PROJECT_VALUES,
      category_id: initialCategoryId ? String(initialCategoryId) : "",
      service_type_id: initialServiceTypeId ? String(initialServiceTypeId) : "",
    },
    validationSchema: createProjectValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const catId = initialCategoryId || Number(values.category_id);
        if (!catId) {
          toast.error("Please select a service category.");
          return;
        }

        const payload = {
          title: values.title.trim(),
          category_id: catId,
          service_type_id: values.service_type_id ? Number(values.service_type_id) : undefined,
          invited_provider_id: providerId ? Number(providerId) : undefined,
          request_type: providerId ? ("direct_quote" as const) : ("open_match" as const),
          description: values.description.trim(),
          address_line: values.address_line.trim(),
          city: values.city.trim() || undefined,
          state: values.state.trim() || undefined,
          zip_code: values.zip_code.trim() || undefined,
          latitude: values.latitude || undefined,
          longitude: values.longitude || undefined,
          budget_min: values.budget_min ? Number(values.budget_min) : undefined,
          budget_max: values.budget_max ? Number(values.budget_max) : undefined,
          urgency: values.urgency,
          preferred_date: values.preferred_date || undefined,
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

        // Single authoritative notification
        toast.success(
          providerId
            ? "Quote request sent! The professional has been notified."
            : "Project posted successfully! Providers are being matched to your request."
        );

        resetForm();
        setFiles([]);
        onOpenChange(false);

        if (onProjectCreated && projectId) {
          onProjectCreated(projectId);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to create project.");
      } finally {
        setSubmitting(false);
      }
    },
  });

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
    if (initialCategoryId) formik.setFieldValue("category_id", String(initialCategoryId));
    if (initialServiceTypeId) formik.setFieldValue("service_type_id", String(initialServiceTypeId));
  }, [initialCategoryId, initialServiceTypeId]);

  const selectedCategory = categories.find(
    (c) => String(c.id) === formik.values.category_id
  );
  const serviceTypes: ServiceType[] = selectedCategory?.service_types || [];

  const isFixedCategory = Boolean(initialCategoryId || providerId);
  const displayCategoryName = categoryName || selectedCategory?.name || "";
  const displaySubCategoryName =
    subCategoryName ||
    serviceTypes.find((s) => String(s.id) === formik.values.service_type_id)?.name ||
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

        <form onSubmit={formik.handleSubmit} className="mt-4 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="font-medium">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs ${
                  formik.values.title.length > 110
                    ? "text-amber-500 font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {formik.values.title.length} / 120
              </span>
            </div>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Leaking pipe repair in master bathroom"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.title && formik.errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-xs font-medium text-destructive mt-1">{formik.errors.title}</p>
            )}
            {formik.values.title.length > 0 && formik.values.title.length < 3 && (
              <p className="text-xs text-amber-500 font-medium">
                Title must be at least 3 characters.
              </p>
            )}
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
                <Select
                  value={formik.values.category_id}
                  onValueChange={(val) => {
                    formik.setFieldValue("category_id", val);
                    formik.setFieldValue("service_type_id", "");
                  }}
                >
                  <SelectTrigger className={formik.touched.category_id && formik.errors.category_id ? "border-destructive focus:ring-destructive" : ""}>
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
                {formik.touched.category_id && formik.errors.category_id && (
                  <p className="text-xs font-medium text-destructive mt-1">
                    {formik.errors.category_id}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium">Specific Sub-Category / Service</Label>
                <Select
                  value={formik.values.service_type_id}
                  onValueChange={(val) => formik.setFieldValue("service_type_id", val)}
                  disabled={!formik.values.category_id || serviceTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !formik.values.category_id
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
            <div className="flex items-center justify-between">
              <Label htmlFor="desc" className="font-medium">
                Description & Details <span className="text-destructive">*</span>
              </Label>
              <span
                className={`text-xs ${
                  formik.values.description.length > 1900
                    ? "text-amber-500 font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {formik.values.description.length} / 2000
              </span>
            </div>
            <Textarea
              id="desc"
              name="description"
              rows={4}
              placeholder="Describe the issue, work scope, size, or any specific requirements for the pro (min 10 characters)..."
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={formik.touched.description && formik.errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-xs font-medium text-destructive mt-1">{formik.errors.description}</p>
            )}
            {formik.values.description.length > 0 && formik.values.description.length < 10 && (
              <p className="text-xs text-amber-500 font-medium">
                Please enter at least {10 - formik.values.description.length} more character(s).
              </p>
            )}
          </div>

          {/* Address & Location with Google Places Autocomplete */}
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
            <h4 className="text-sm font-semibold">Service Location</h4>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs">
                Street Address <span className="text-destructive">*</span>
              </Label>
              <GooglePlaceAutocomplete
                placeholder="Search street address or landmark..."
                value={formik.values.address_line}
                onChange={(val) => formik.setFieldValue("address_line", val)}
                onSelect={(place) => {
                  const parsed = parseGooglePlace(place);
                  formik.setFieldValue("address_line", parsed.address || place.address);
                  if (parsed.city) formik.setFieldValue("city", parsed.city);
                  if (parsed.state) formik.setFieldValue("state", parsed.state);
                  if (parsed.zip) formik.setFieldValue("zip_code", parsed.zip);
                  if (place.lat) formik.setFieldValue("latitude", place.lat);
                  if (place.lng) formik.setFieldValue("longitude", place.lng);
                }}
                className={formik.touched.address_line && formik.errors.address_line ? "border-destructive" : ""}
              />
              {formik.touched.address_line && formik.errors.address_line && (
                <p className="text-xs font-medium text-destructive mt-1">{formik.errors.address_line}</p>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Austin"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs">State</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="TX"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip" className="text-xs">Zip Code</Label>
                <Input
                  id="zip"
                  name="zip_code"
                  placeholder="78701"
                  value={formik.values.zip_code}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.zip_code && formik.errors.zip_code ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formik.touched.zip_code && formik.errors.zip_code && (
                  <p className="text-xs font-medium text-destructive mt-1">{formik.errors.zip_code}</p>
                )}
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
                  name="budget_min"
                  value={formik.values.budget_min}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.budget_min && formik.errors.budget_min ? "border-destructive" : ""}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  name="budget_max"
                  value={formik.values.budget_max}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.budget_max && formik.errors.budget_max ? "border-destructive" : ""}
                />
              </div>
              {(formik.errors.budget_min || formik.errors.budget_max) && (
                <p className="text-xs font-medium text-destructive mt-1">
                  {formik.errors.budget_max || formik.errors.budget_min}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Urgency</Label>
              <Select
                value={formik.values.urgency}
                onValueChange={(val: any) => formik.setFieldValue("urgency", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
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
                name="preferred_date"
                value={formik.values.preferred_date}
                onChange={formik.handleChange}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments / Photos (Optional)</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-medium hover:border-primary hover:bg-primary-soft/10 transition-colors">
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
              disabled={formik.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? (
                <>
                  <Loader2 size={15} className="mr-2 animate-spin" /> Submitting...
                </>
              ) : providerId ? (
                "Request Quote"
              ) : (
                "Post Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
