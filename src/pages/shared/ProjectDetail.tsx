import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  Paperclip,
  CheckCircle,
  XCircle,
  Loader2,
  FileQuestion,
  Sparkles,
  Send,
  UserCheck,
  DollarSign,
  Eye,
  RefreshCw,
  Star,
  ShieldCheck,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerPortal, ProviderPortal, RolePortal } from "@/components/layout/portals";
import { StatusPill, EmptyState, Stars, VerifiedBadge, PageHeader } from "@/components/shared/primitives";
import { Timeline } from "@/components/shared/Timeline";
import { SubmitProposalModal } from "@/components/projects/SubmitProposalModal";
import { DocumentPreviewModal } from "@/components/shared/DocumentPreviewModal";
import { projectApi, proposalApi } from "@/services/project";
import { chatApi } from "@/services/chat";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import {
  REQUEST_TIMELINE_STEPS,
  mapProjectStatusToTimelineStep,
  getProjectTimelineStepStates,
} from "@/constants/project.constants";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import type { Project } from "@/types/api/project";
import type { Proposal } from "@/types/api/proposal";
import { usd } from "@/components/shared/cards";
import { formatDate } from "@/utils/date";
import toast from "react-hot-toast";

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthSession();

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingModalOpen, setProposingModalOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const projectId = Number(id);

  const fetchProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const projRes = await projectApi.getById(projectId);
      console.log(projRes, "projResprojResprojRes")
      const projData = (projRes as any)?.data || projRes;
      setProject(projData);

      // Fetch proposals for project
      try {
        const propRes = await proposalApi.listForProject(projectId);
        const propList = (propRes as any)?.data || propRes || [];
        setProposals(Array.isArray(propList) ? propList : []);
      } catch (propErr) {
        console.log("No proposals or unauthorized for proposal list", propErr);
      }
    } catch (err) {
      console.error("Failed to load project details", err);
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleOpenChat = async () => {
    if (!project) return;
    try {
      const res = await chatApi.createChat({ project_id: project.id });
      const chat = (res as any)?.data || res;
      navigate("/messages", { state: { selectedChatId: chat.id || chat.chat_id } });
    } catch (err: any) {
      toast.error("Could not open chat room.");
    }
  };

  const handleAcceptProposal = async (proposalId: number) => {
    setAcceptingId(proposalId);
    try {
      await proposalApi.accept(proposalId);
      toast.success("Proposal accepted! Service appointment created and job scheduled.");
      fetchProjectData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to accept proposal.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectProposal = async (proposalId: number) => {
    try {
      await proposalApi.reject(proposalId);
      toast.success("Proposal rejected.");
      fetchProjectData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to reject proposal.");
    }
  };

  const userIsCustomer = isCustomer(user?.role_id);
  const userIsProvider = isProvider(user?.role_id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Project not found"
        description="The requested project is not available or has been deleted."
        action={
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        }
      />
    );
  }

  const dateStr = project.preferred_date
    ? formatDate(project.preferred_date)
    : "Flexible";

  const displayId = `CSR-${project.id}`;
  const providerOrCategory =
    project.invited_provider?.business_name ||
    project.provider?.business_name ||
    project.provider?.name ||
    project.category?.name ||
    "Custom Service Request";

  const effectiveStatus =
    (project as any).booking?.appointment_status ||
    (project as any).booking?.status ||
    project.status;

  const currentTimelineStep = mapProjectStatusToTimelineStep(effectiveStatus, proposals.length);
  const timelineStepStates = getProjectTimelineStepStates(
    effectiveStatus,
    (project as any).payment_status || (project as any).booking?.payment_status
  );

  return (
    <div>
      <div className="mb-4">
        <Link
          to={userIsCustomer ? "/projects" : "/provider/opportunities"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} /> All custom requests
        </Link>
      </div>

      {/* PageHeader matching service-connect & Image 2 */}
      <PageHeader
        title={project.title}
        subtitle={`${displayId} · Booked Service with ${providerOrCategory}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={currentTimelineStep} />
            <Button onClick={handleOpenChat} variant="outline" className="gap-2">
              <MessageSquare size={16} /> Message Pro
            </Button>
            {userIsCustomer && (
              <>
                {project.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { }}
                    disabled={false}
                    className="gap-1.5"
                  >
                    <RefreshCw size={14} />
                    Find Matches
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => { }}
                  disabled={project.status === "cancelled"}
                >
                  Cancel Project
                </Button>
              </>
            )}
            {userIsProvider && project.status === "open" && (
              <Button onClick={() => navigate(`/provider/custom-requests/${project.id}`)} className="gap-2">
                <Sparkles size={16} /> Submit Proposal
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Left Column: Details & Proposals */}
        <div className="space-y-6">
          {/* Service Details (matching Image 2) */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
            <h2 className="font-display text-lg font-bold">Service Details</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {project.description || "No description provided."}
            </p>
            <Separator className="my-5" />
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail icon={CalendarDays} label="Date" value={dateStr} />
              <Detail
                icon={Clock}
                label="Time"
                value={project.urgency ? (project.urgency.charAt(0).toUpperCase() + project.urgency.slice(1)) : "Flexible"}
              />
              <Detail
                icon={MapPin}
                label="Location"
                value={[project.address_line, project.city, project.state, project.zip_code].filter(Boolean).join(", ") || "Location not provided"}
              />
              <Detail
                icon={Star}
                label="Professional"
                value={providerOrCategory}
              />
            </dl>

            {project.budget_min && project.budget_max && (
              <div className="rounded-xl bg-muted/40 p-3.5 text-xs text-muted-foreground flex justify-between items-center">
                <span>Estimated Budget:</span>
                <span className="font-bold text-primary text-sm">
                  {usd(project.budget_min)} - {usd(project.budget_max)}
                </span>
              </div>
            )}

            {/* Attachments */}
            {project.attachments && (project.attachments as any[]).length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">
                  Project Attachments ({(project.attachments as any[]).length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {(project.attachments as any[]).map((att: any, idx: number) => {
                    const rawPath = att.file_url || att.file_path || att.file_key || att.url;
                    const fileUrl = resolveMediaUrl(rawPath);
                    const fileName = att.original_name || att.file_name || att.filename || `Attachment ${idx + 1}`;
                    return (
                      <div
                        key={att.id || fileName || idx}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs hover:border-primary transition-colors"
                      >
                        <Paperclip size={13} className="text-primary shrink-0" />
                        <span className="max-w-[140px] truncate font-medium">{fileName}</span>
                        {fileUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewAttachment({
                                url: fileUrl,
                                filename: fileName,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded bg-primary-soft/80 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary-soft transition-colors cursor-pointer"
                          >
                            <Eye size={12} /> View
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground opacity-60">No URL</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Rating & Review Locked Notice matching Image 2 */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card text-xs text-muted-foreground flex items-center gap-3">
            <Star size={18} className="text-muted-foreground shrink-0" />
            <p>
              <strong>Rating &amp; Review Locked:</strong> Reviews can only be submitted once the provider marks the job as <strong>Completed</strong>.
            </p>
          </div>

          {/* Proposals Section */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold">
                  Proposals & Quotes ({proposals.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  {userIsCustomer
                    ? "Review quotes submitted by matched local professionals and accept the best offer."
                    : "Proposals submitted for this project request."}
                </p>
              </div>
            </div>

            {proposals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <h2 className="font-display text-lg font-bold">Awaiting Provider Quote</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {providerOrCategory} is reviewing your requirement and will send custom pricing. You'll be able to
                  accept, reject or ask for changes here.
                </p>
                {userIsProvider && project.status === "open" && (
                  <Button
                    onClick={() => setProposingModalOpen(true)}
                    className="mt-4 gap-2"
                    size="sm"
                  >
                    Submit Proposal Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((prop) => {
                  const isAccepted = prop.status === "accepted";
                  const isRejected = prop.status === "rejected";
                  const providerName =
                    (prop.provider as any)?.business_name || (prop.provider as any)?.user?.full_name || "Provider";

                  return (
                    <div
                      key={prop.id}
                      className={`rounded-2xl border p-5 transition-all ${isAccepted
                        ? "border-success bg-success-soft/10 shadow-sm"
                        : "border-border bg-card"
                        }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                            {providerName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-bold text-base">{providerName}</h3>
                              {(prop.provider as any)?.verified === "verified" && <VerifiedBadge compact />}
                              <StatusPill status={prop.status || "submitted"} />
                            </div>
                            {(prop.provider as any)?.rating && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Stars rating={(prop.provider as any).rating} size={12} />
                                <span>{(prop.provider as any).rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">Quote Amount</span>
                          <span className="font-display text-xl font-bold text-primary">
                            {usd(prop.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Proposal Message */}
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground bg-muted/40 p-3 rounded-xl">
                        "{prop.message}"
                      </p>

                      {/* Line Items */}
                      {prop.line_items && prop.line_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <span className="text-xs font-semibold text-muted-foreground block mb-1.5">
                            Itemized Breakdown
                          </span>
                          <div className="space-y-1">
                            {prop.line_items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-muted/20"
                              >
                                <span>
                                  {item.description} ({item.quantity}x @ ${item.unit_price})
                                </span>
                                <span className="font-semibold">
                                  ${(item.quantity * item.unit_price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Details & Actions */}
                      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                          {prop.estimated_duration_hours && (
                            <span>Est: {prop.estimated_duration_hours} hours</span>
                          )}
                          {prop.proposed_date && (
                            <span>Start: {formatDate(prop.proposed_date)}</span>
                          )}
                        </div>

                        {userIsCustomer && ((prop.status as string) === "submitted" || (prop.status as string) === "pending") && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectProposal(prop.id)}
                              className="h-8 text-xs text-destructive hover:bg-destructive-soft"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptProposal(prop.id)}
                              disabled={acceptingId === prop.id}
                              className="h-8 text-xs gap-1 bg-success hover:bg-success/90"
                            >
                              {acceptingId === prop.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle size={13} />
                              )}
                              Accept Proposal
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Status Timeline & Sidebar (matching Image 2) */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Request timeline</h2>
            <div className="mt-4">
              <Timeline
                steps={REQUEST_TIMELINE_STEPS as any}
                current={currentTimelineStep}
                stepStates={timelineStepStates}
              />
            </div>
          </section>

          {/* Payment Breakdown Card (matching Image 2) */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Payment Breakdown</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal (Services)</dt>
                <dd className="font-medium">
                  {project.budget_min ? usd(project.budget_min) : "Flexible"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Service Fee</dt>
                <dd className="font-medium">Included</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Estimated Total</span>
              <span className="font-display text-xl font-bold">
                {project.budget_max
                  ? usd(project.budget_max)
                  : project.budget_min
                    ? usd(project.budget_min)
                    : "Custom Quote"}
              </span>
            </div>
          </section>

          {Boolean(project.booking_id) && !userIsProvider && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-base font-bold">Active service</h2>
              <p className="mt-1 text-sm text-muted-foreground">Booking #{project.booking_id}</p>
              <Button
                className="mt-4 w-full"
                onClick={() =>
                  navigate(
                    userIsCustomer
                      ? `/customer/bookings/${project.booking_id}`
                      : `/provider/order/${project.booking_id}`
                  )
                }
              >
                Open booking
              </Button>
            </section>
          )}

          {/* Quick Help Card */}
          <div className="rounded-2xl border border-primary/20 bg-primary-soft/10 p-5">
            <h4 className="font-display font-bold text-sm text-primary mb-1">
              How Custom Quotes Work
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When providers respond to your request, review their itemized quotes. Once you accept a proposal, your appointment will be scheduled automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Proposal Modal (for Providers) */}
      {userIsProvider && (
        <SubmitProposalModal
          open={proposingModalOpen}
          onOpenChange={setProposingModalOpen}
          projectId={project.id}
          projectTitle={project.title}
          onProposalSubmitted={fetchProjectData}
        />
      )}

      {/* Attachment Preview Modal */}
      <DocumentPreviewModal
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
        documentUrl={previewAttachment?.url}
        title={previewAttachment?.filename || "Project Attachment"}
        filename={previewAttachment?.filename}
        description={`Attachment for project #${project.id} (${project.title}).`}
      />
    </div>
  );
};

export default ProjectDetail;
