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
  Tag,
  BadgeDollarSign,
  User,
  Mail,
  Phone,
  ExternalLink,
  Calculator,
  Info,
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
import { bookingApi } from "@/services/booking";
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
  calculateGrossQuoteAmount,
} from "@/validations";

export const ProviderCustomRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  interface PriceBreakdownState {
    service_fee_rate: number;
    service_fee: number;
    platform_fee: number;
    tax_rate: number;
    tax_amount: number;
    subtotal: number;
    total: number;
  }

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdownState | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  const formik = useFormik<CustomQuoteFormValues>({
    initialValues: DEFAULT_CUSTOM_QUOTE_VALUES,
    validationSchema: customQuoteValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const netQuoteAmount = calculateQuoteTotal(values);
      if (netQuoteAmount <= 0) {
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
        const discountNum = Number(values.discount) || 0;
        const noteWithDiscount = discountNum > 0
          ? `${values.workDescription.trim()}\n\nNote: Includes applied discount of $${discountNum}.`
          : values.workDescription.trim();

        const payload: CustomQuoteSubmitPayload = {
          amount: netQuoteAmount,
          discount: discountNum,
          discount_amount: discountNum,
          currency: "usd",
          message: noteWithDiscount,
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

  const laborNum = Number(formik.values.labor) || 0;
  const materialsNum = Number(formik.values.materials) || 0;
  const feesNum = Number(formik.values.fees) || 0;
  const discountNum = Number(formik.values.discount) || 0;
  const taxNum = Number(formik.values.tax) || 0;

  const grossQuoteAmount = calculateGrossQuoteAmount(formik.values);
  const netQuoteAmount = calculateQuoteTotal(formik.values);
  const subtotalBeforeTax = Math.max(0, laborNum + materialsNum + feesNum);

  useEffect(() => {
    let isMounted = true;

    const fetchPriceBreakdown = async () => {
      if (grossQuoteAmount <= 0) {
        if (isMounted) {
          setPriceBreakdown(null);
          setCalculatingPrice(false);
        }
        return;
      }
      setCalculatingPrice(true);
      try {
        const lineItems: Array<{ service_name: string; quantity: number; price: number }> = [
          { service_name: "Labor & Service", quantity: 1, price: laborNum },
        ];
        if (materialsNum > 0) {
          lineItems.push({ service_name: "Materials & Supplies", quantity: 1, price: materialsNum });
        }
        if (feesNum > 0) {
          lineItems.push({ service_name: "Additional Fees", quantity: 1, price: feesNum });
        }
        if (taxNum > 0) {
          lineItems.push({ service_name: "Taxes", quantity: 1, price: taxNum });
        }

        const payload = {
          subtotal: grossQuoteAmount,
          total_amount: grossQuoteAmount,
          discount: discountNum,
          items: lineItems,
        };

        const res: any = await bookingApi.calculatePrice(payload);
        const data = res?.data?.data || res?.data?.breakdown || res?.data;

        if (isMounted && data) {
          setPriceBreakdown({
            service_fee_rate: Number(data.service_fee_rate) || PLATFORM_COMMISSION_PERCENT,
            service_fee: Number(data.service_fee) || Number(data.commission_amount) || Math.round(netQuoteAmount * 0.05 * 100) / 100,
            platform_fee: Number(data.platform_fee) || Number(data.platform_fee_amount) || 0,
            tax_rate: Number(data.tax_rate) || 0,
            tax_amount: Number(data.tax_amount) || 0,
            subtotal: Number(data.subtotal ?? data.proposal_total) || netQuoteAmount,
            total: Number(data.total ?? data.customer_total) || netQuoteAmount,
          });
        }
      } catch (err) {
        console.error("Backend price calculation error:", err);
      } finally {
        if (isMounted) {
          setCalculatingPrice(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchPriceBreakdown();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [laborNum, materialsNum, feesNum, discountNum, taxNum, grossQuoteAmount, netQuoteAmount]);

  const commissionRate = priceBreakdown?.service_fee_rate ?? PLATFORM_COMMISSION_PERCENT;
  const flatPlatformFee = priceBreakdown?.platform_fee ?? 0;
  const split = calculateQuoteSplit(netQuoteAmount, commissionRate, flatPlatformFee);

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
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                Customer requirement
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {project.category?.name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Tag size={12} /> {project.category.name}
                  </span>
                )}
                {project.service_type?.name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    {project.service_type.name}
                  </span>
                )}
                {project.request_type && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                    {project.request_type.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>

            {project.customer_notes && (
              <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                {project.customer_notes}
              </p>
            )}

            <Separator className="my-3" />

            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CalendarDays size={15} className="shrink-0 text-primary" /> {dateLabel}
              </span>
              <span className="inline-flex items-center gap-2 text-muted-foreground capitalize">
                <Clock size={15} className="shrink-0 text-primary" />{" "}
                {project.urgency || "Flexible"}
              </span>
              {(project.budget_min || project.budget_max) && (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <BadgeDollarSign size={15} className="shrink-0 text-primary" />{" "}
                  <span>
                    Budget: {usd(Number(project.budget_min) || 0)} - {usd(Number(project.budget_max) || 0)}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin size={15} className="shrink-0 text-primary" />{" "}
                <span className="truncate">{location}</span>
              </span>
            </div>

            {project.customer && (
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                  <User size={14} className="text-primary" />
                  {project.customer.full_name || "Customer"}
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  {project.customer.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={12} className="text-muted-foreground" />
                      {project.customer.email}
                    </span>
                  )}
                  {project.customer.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={12} className="text-muted-foreground" />
                      {project.customer.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="pt-3 border-t border-border">
                <h4 className="text-xs font-semibold text-foreground mb-2">Attachments ({attachments.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att: any, idx: number) => {
                    const name = att.original_name || att.filename || att.name || `attachment-${idx + 1}`;
                    const isImg = /\.(png|jpe?g|webp|gif)$/i.test(name) || (att.mime_type && att.mime_type.startsWith("image/"));
                    const fileUrl = att.file_key
                      ? (att.file_key.startsWith("http") ? att.file_key : `http://localhost:5000${att.file_key}`)
                      : null;

                    return (
                      <a
                        key={att.id || idx}
                        href={fileUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                      >
                        {isImg ? (
                          <ImageIcon size={13} className="text-primary" />
                        ) : (
                          <FileText size={13} className="text-primary" />
                        )}
                        <span className="truncate max-w-[180px]">{name}</span>
                        {fileUrl && <ExternalLink size={11} className="text-muted-foreground ml-0.5" />}
                      </a>
                    );
                  })}
                </div>
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

            <Separator className="my-3" />

            {/* Comprehensive Price Calculation Breakdown Card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Calculator size={16} className="text-primary" />
                  Price & Earnings Breakdown
                </div>
                {calculatingPrice && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                    <Loader2 size={13} className="animate-spin text-primary" /> Recalculating…
                  </span>
                )}
              </div>

              {/* Line items & Customer Price */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross Quote Subtotal</span>
                  <span className="font-medium text-foreground">{usd(grossQuoteAmount)}</span>
                </div>

                {discountNum > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount Applied</span>
                    <span className="font-medium">-{usd(discountNum)}</span>
                  </div>
                )}

                {discountNum > 0 && (
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Net Service Quote</span>
                    <span className="text-foreground">{usd(netQuoteAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Service Fee ({commissionRate}%)</span>
                  <span className="font-medium text-foreground">+{usd(priceBreakdown?.service_fee ?? split.commission)}</span>
                </div>

                {split.flatFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform Flat Fee</span>
                    <span className="font-medium text-foreground">+{usd(split.flatFee)}</span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-foreground text-sm pt-2 border-t border-border/60">
                  <span>Total Customer Payment</span>
                  <span className="font-display text-base text-primary">
                    {usd(priceBreakdown?.total || (netQuoteAmount + split.totalFees))}
                  </span>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Provider Net Earnings */}
              <div className="rounded-lg bg-primary/5 p-3 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Submitted Proposal Amount (Net Service Quote)</span>
                  <span className="font-semibold text-foreground">{usd(netQuoteAmount)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-primary/20 font-bold text-sm text-foreground">
                  <span>Provider Net Quote Amount</span>
                  <span className="font-display text-lg text-emerald-600 dark:text-emerald-400">
                    {usd(netQuoteAmount)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={formik.isSubmitting || grossQuoteAmount <= 0}
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
