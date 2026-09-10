import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  FileQuestion,
  FileText,
  ImageIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/shared/Timeline";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { projectApi, proposalApi } from "@/services/project";
import { formatDate } from "@/utils/date";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import type { Project } from "@/types/api/project";
import type {
  CustomQuoteFormValues,
  CustomQuoteSubmitPayload,
} from "@/types";
import {
  DEFAULT_CUSTOM_QUOTE_VALUES,
  PLATFORM_COMMISSION_PERCENT,
  CUSTOM_QUOTE_FORM_STYLES,
  REQUEST_TIMELINE_STEPS,
  mapProjectStatusToTimelineStep,
  getProjectTimelineStepStates,
} from "@/constants";
import {
  customQuoteValidationSchema,
  calculateQuoteSplit,
  calculateQuoteTotal,
} from "@/validations";

export const ProviderCustomRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const formik = useFormik<CustomQuoteFormValues>({
    initialValues: DEFAULT_CUSTOM_QUOTE_VALUES,
    validationSchema: customQuoteValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const totalAmount = calculateQuoteTotal(values);
      if (totalAmount <= 0) {
        toast.error("Total quote amount must be greater than $0.");
        return;
      }

      setSubmitting(true);
      try {
        const validUntilDate = new Date();
        validUntilDate.setDate(validUntilDate.getDate() + 7);

        const lineItems = [
          {
            description: "Labor & Service",
            quantity: 1,
            unit_price: Number(values.labor) || 0,
          },
        ];

        if (Number(values.materials) > 0) {
          lineItems.push({
            description: "Materials & Supplies",
            quantity: 1,
            unit_price: Number(values.materials),
          });
        }
        if (Number(values.fees) > 0) {
          lineItems.push({
            description: "Additional Fees",
            quantity: 1,
            unit_price: Number(values.fees),
          });
        }
        if (Number(values.tax) > 0) {
          lineItems.push({
            description: "Taxes",
            quantity: 1,
            unit_price: Number(values.tax),
          });
        }
        if (Number(values.discount) > 0) {
          lineItems.push({
            description: "Discount",
            quantity: 1,
            unit_price: -Number(values.discount),
          });
        }

        const payload: CustomQuoteSubmitPayload = {
          amount: totalAmount,
          currency: "usd",
          message: values.workDescription.trim(),
          valid_until: validUntilDate.toISOString(),
          line_items: lineItems,
        };

        await proposalApi.createForProject(projectId, payload as any);
        toast.success("Quote sent to customer successfully!");
        navigate(`/projects/${projectId}`);
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to submit quote."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fetchProject = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await projectApi.getById(projectId);
      const data = (res as any)?.data || res;
      setProject(data);
    } catch (err: any) {
      console.error("Failed to load project", err);
      toast.error("Failed to load request details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const total = calculateQuoteTotal(formik.values);
  const split = calculateQuoteSplit(total, PLATFORM_COMMISSION_PERCENT);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading custom request...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FileQuestion}
          title="Request not found"
          description="This custom request is no longer available or was not found."
          action={
            <Button asChild>
              <Link to="/provider/opportunities">Back to requests</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const customerName = project.customer?.full_name || "Customer";

  const location =
    [project.address_line, project.city, project.state, project.zip_code]
      .filter(Boolean)
      .join(", ") || "Location specified in request";

  const dateLabel = project.preferred_date
    ? formatDate(project.preferred_date)
    : "Flexible timing";

  const effectiveStatus =
    (project as any).booking?.appointment_status ||
    (project as any).booking?.status ||
    project.status;

  const timelineStep = mapProjectStatusToTimelineStep(effectiveStatus, 0);
  const timelineStepStates = getProjectTimelineStepStates(
    effectiveStatus,
    (project as any).payment_status || (project as any).booking?.payment_status
  );

  const attachments = Array.isArray(project.attachments) ? project.attachments : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top back navigation matching Image 3 */}
      <Link
        to="/provider/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={15} /> All custom requests
      </Link>

      <PageHeader
        title={project.title}
        subtitle={`CSR-${project.id} · ${customerName} · submitted ${
          project.created_at ? formatDate(project.created_at) : "recently"
        }`}
        action={<StatusPill status={project.status || "Quote Pending"} />}
      />

      {/* 2-Column Layout matching Image 3 & service-connect */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left Column: Customer Requirement */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-foreground">
              Customer requirement
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>

            {project.customer_notes && (
              <p className="mt-3 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                {project.customer_notes}
              </p>
            )}

            <Separator className="my-5" />

            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CalendarDays size={15} className="shrink-0 text-primary" /> {dateLabel}
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground capitalize">
                <Clock size={15} className="shrink-0 text-primary" />{" "}
                {project.urgency || "Flexible"}
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin size={15} className="shrink-0 text-primary" />{" "}
                <span className="truncate">{location}</span>
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 pt-3 border-t border-border">
                {attachments.map((att: any, idx: number) => {
                  const name = att.filename || att.name || `attachment-${idx + 1}`;
                  const isImg = /\.(png|jpe?g|webp|gif)$/i.test(name);
                  return (
                    <span
                      key={att.id || idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-foreground"
                    >
                      {isImg ? (
                        <ImageIcon size={13} className="text-primary" />
                      ) : (
                        <FileText size={13} className="text-primary" />
                      )}
                      <span className="truncate max-w-[180px]">{name}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-foreground">
              Request timeline
            </h2>
            <div className="mt-4">
              <Timeline
                steps={REQUEST_TIMELINE_STEPS as any}
                current={timelineStep}
                stepStates={timelineStepStates}
              />
            </div>
          </div>
        </section>

        {/* Right Column: Custom Quote Builder */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-foreground">
            Custom quote builder
          </h2>

          <form onSubmit={formik.handleSubmit} className="mt-4 grid gap-4">
            <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
              <Label htmlFor="workDescription" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                Work description <span className={CUSTOM_QUOTE_FORM_STYLES.requiredStar}>*</span>
              </Label>
              <Textarea
                id="workDescription"
                name="workDescription"
                rows={4}
                placeholder="Describe exactly what you'll do…"
                value={formik.values.workDescription}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={cn(
                  formik.touched.workDescription &&
                    formik.errors.workDescription &&
                    CUSTOM_QUOTE_FORM_STYLES.inputError
                )}
              />
              {formik.touched.workDescription && formik.errors.workDescription && (
                <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>
                  {formik.errors.workDescription}
                </p>
              )}
            </div>

            <div className={CUSTOM_QUOTE_FORM_STYLES.fieldGroupGrid}>
              <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
                <Label htmlFor="labor" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                  Labor cost ($) <span className={CUSTOM_QUOTE_FORM_STYLES.requiredStar}>*</span>
                </Label>
                <Input
                  id="labor"
                  name="labor"
                  type="number"
                  min={0}
                  step="any"
                  value={formik.values.labor}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.labor &&
                      formik.errors.labor &&
                      CUSTOM_QUOTE_FORM_STYLES.inputError
                  )}
                />
                {formik.touched.labor && formik.errors.labor && (
                  <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>{formik.errors.labor}</p>
                )}
              </div>

              <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
                <Label htmlFor="materials" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                  Materials cost ($)
                </Label>
                <Input
                  id="materials"
                  name="materials"
                  type="number"
                  min={0}
                  step="any"
                  value={formik.values.materials}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.materials &&
                      formik.errors.materials &&
                      CUSTOM_QUOTE_FORM_STYLES.inputError
                  )}
                />
                {formik.touched.materials && formik.errors.materials && (
                  <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>
                    {formik.errors.materials}
                  </p>
                )}
              </div>

              <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
                <Label htmlFor="fees" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                  Additional fees ($)
                </Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  min={0}
                  step="any"
                  value={formik.values.fees}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.fees &&
                      formik.errors.fees &&
                      CUSTOM_QUOTE_FORM_STYLES.inputError
                  )}
                />
                {formik.touched.fees && formik.errors.fees && (
                  <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>{formik.errors.fees}</p>
                )}
              </div>

              <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
                <Label htmlFor="discount" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                  Discount ($)
                </Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min={0}
                  step="any"
                  value={formik.values.discount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.discount &&
                      formik.errors.discount &&
                      CUSTOM_QUOTE_FORM_STYLES.inputError
                  )}
                />
                {formik.touched.discount && formik.errors.discount && (
                  <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>
                    {formik.errors.discount}
                  </p>
                )}
              </div>

              <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
                <Label htmlFor="tax" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                  Taxes ($)
                </Label>
                <Input
                  id="tax"
                  name="tax"
                  type="number"
                  min={0}
                  step="any"
                  value={formik.values.tax}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.tax &&
                      formik.errors.tax &&
                      CUSTOM_QUOTE_FORM_STYLES.inputError
                  )}
                />
                {formik.touched.tax && formik.errors.tax && (
                  <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>{formik.errors.tax}</p>
                )}
              </div>

              <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
                <Label htmlFor="completion" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                  Estimated completion <span className={CUSTOM_QUOTE_FORM_STYLES.requiredStar}>*</span>
                </Label>
                <Input
                  id="completion"
                  name="completion"
                  value={formik.values.completion}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={cn(
                    formik.touched.completion &&
                      formik.errors.completion &&
                      CUSTOM_QUOTE_FORM_STYLES.inputError
                  )}
                />
                {formik.touched.completion && formik.errors.completion && (
                  <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>
                    {formik.errors.completion}
                  </p>
                )}
              </div>
            </div>

            <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
              <Label htmlFor="expires" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                Quote expiry <span className={CUSTOM_QUOTE_FORM_STYLES.requiredStar}>*</span>
              </Label>
              <Input
                id="expires"
                name="expires"
                value={formik.values.expires}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={cn(
                  formik.touched.expires &&
                    formik.errors.expires &&
                    CUSTOM_QUOTE_FORM_STYLES.inputError
                )}
              />
              {formik.touched.expires && formik.errors.expires && (
                <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>{formik.errors.expires}</p>
              )}
            </div>

            <div className={CUSTOM_QUOTE_FORM_STYLES.fieldWrapper}>
              <Label htmlFor="terms" className={CUSTOM_QUOTE_FORM_STYLES.label}>
                Terms & conditions
              </Label>
              <Textarea
                id="terms"
                name="terms"
                rows={3}
                value={formik.values.terms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={cn(
                  formik.touched.terms &&
                    formik.errors.terms &&
                    CUSTOM_QUOTE_FORM_STYLES.inputError
                )}
              />
              {formik.touched.terms && formik.errors.terms && (
                <p className={CUSTOM_QUOTE_FORM_STYLES.errorText}>{formik.errors.terms}</p>
              )}
            </div>

            <Separator className="my-2" />

            <div className={CUSTOM_QUOTE_FORM_STYLES.summaryCard}>
              <div className={CUSTOM_QUOTE_FORM_STYLES.summaryTotal}>
                <span>Total quote</span>
                <span className="font-display text-xl">{usd(total)}</span>
              </div>
              <div className={CUSTOM_QUOTE_FORM_STYLES.summaryFee}>
                <span>Platform fee ({PLATFORM_COMMISSION_PERCENT}%)</span>
                <span>{usd(split.commission)}</span>
              </div>
              <div className={CUSTOM_QUOTE_FORM_STYLES.summaryReceive}>
                <span>You receive</span>
                <span>{usd(split.payable)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={formik.isSubmitting || total <= 0}
              className={CUSTOM_QUOTE_FORM_STYLES.submitButton}
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting quote…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Send quote to customer
                </>
              )}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProviderCustomRequestDetail;
