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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerPortal, ProviderPortal, RolePortal } from "@/components/layout/portals";
import { StatusPill, EmptyState, Stars, VerifiedBadge } from "@/components/shared/primitives";
import { Timeline } from "@/components/shared/Timeline";
import { SubmitProposalModal } from "@/components/m3/SubmitProposalModal";
import { DocumentPreviewModal } from "@/components/shared/DocumentPreviewModal";
import { projectApi } from "@/api/modules/project.api";
import { proposalApi } from "@/api/modules/proposal.api";
import { chatApi } from "@/api/modules/chat.api";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import type { Project } from "@/types/api/project";
import type { Proposal } from "@/types/api/proposal";
import { usd } from "@/components/shared/cards";
import toast from "react-hot-toast";

const PROJECT_STEPS = [
  "Project Published",
  "Provider Matching",
  "Proposals Received",
  "Proposal Accepted",
  "Job Scheduled",
  "Service Completed",
];

function getTimelineCurrent(status?: string): string {
  if (!status || status === "draft" || status === "open") return "Project Published";
  if (status === "matching") return "Provider Matching";
  if (status === "proposals_received") return "Proposals Received";
  if (status === "accepted") return "Proposal Accepted";
  if (status === "scheduled" || status === "in_progress") return "Job Scheduled";
  if (status === "completed") return "Service Completed";
  return "Project Published";
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
    ? new Date(project.preferred_date).toLocaleDateString()
    : "Flexible";

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-muted-foreground">Project #{project.id}</span>
            <StatusPill status={project.status || "open"} />
            {project.category && (
              <span className="rounded-full bg-primary-soft/80 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {project.category.name}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} className="text-primary" />
              {[project.address_line, project.city, project.state].filter(Boolean).join(", ")}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} /> {dateStr}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleOpenChat} variant="outline" className="gap-2">
            <MessageSquare size={16} /> Project Chat
          </Button>

          {userIsProvider && project.status === "open" && (
            <Button onClick={() => setProposingModalOpen(true)} className="gap-2">
              <Sparkles size={16} /> Submit Proposal
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Details & Proposals */}
        <div className="space-y-6">
          {/* Project Overview */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-3">Requirement Overview</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-3 mt-6 pt-4 border-t border-border text-xs">
              <div>
                <span className="text-muted-foreground block">Estimated Budget</span>
                <span className="font-display text-sm font-bold text-primary">
                  {project.budget_min || project.budget_max
                    ? `${usd(project.budget_min || 0)} - ${usd(project.budget_max || 0)}`
                    : "Flexible Quote"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Urgency</span>
                <span className="font-semibold capitalize text-foreground">
                  {project.urgency || "soon"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Posted Date</span>
                <span className="font-semibold text-foreground">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "Recently"}
                </span>
              </div>
            </div>

            {/* Attachments */}
            {project.attachments && project.attachments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">
                  Project Attachments ({project.attachments.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {project.attachments.map((att: any) => {
                    const fileUrl = att.file_url || att.file_path || att.file_key || att.url;
                    const fileName = att.original_name || att.file_name || att.filename || "Attachment";
                    return (
                      <div
                        key={att.id || fileName}
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
                            className="inline-flex items-center gap-1 rounded bg-primary-soft/80 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary-soft transition-colors"
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
              <div className="rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
                <Sparkles size={28} className="mx-auto text-primary/60 mb-2" />
                <p className="text-sm font-semibold">No proposals received yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userIsProvider
                    ? "Be the first verified professional to submit a proposal for this project!"
                    : "Our matching engine has notified verified local pros. You'll see their quotes here soon."}
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
                    prop.provider?.business_name || prop.provider?.user?.full_name || "Provider";

                  return (
                    <div
                      key={prop.id}
                      className={`rounded-2xl border p-5 transition-all ${
                        isAccepted
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
                              {prop.provider?.verified === "verified" && <VerifiedBadge compact />}
                              <StatusPill status={prop.status || "submitted"} />
                            </div>
                            {prop.provider?.rating && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Stars rating={prop.provider.rating} size={12} />
                                <span>{prop.provider.rating.toFixed(1)}</span>
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
                            <span>Start: {new Date(prop.proposed_date).toLocaleDateString()}</span>
                          )}
                        </div>

                        {userIsCustomer && (prop.status === "submitted" || prop.status === "pending") && (
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

        {/* Right Column: Status Timeline */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-display font-bold text-sm mb-4">Project Status Timeline</h3>
            <Timeline
              steps={PROJECT_STEPS}
              current={getTimelineCurrent(project.status)}
            />
          </section>

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
