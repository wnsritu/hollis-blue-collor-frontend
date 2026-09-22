import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CalendarDays,
  Clock,
  DollarSign,
  Loader2,
  FileQuestion,
  FileText,
  Layers,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/primitives";
import { matchingApi } from "@/services/provider";
import { projectApi } from "@/services/project";
import type { ProjectMatch } from "@/types/api/matching";
import { usd } from "@/components/shared/cards";
import { formatDate, formatRelativeDate } from "@/utils/date";
import toast from "react-hot-toast";

export const ProviderLeads: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ProjectMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "open">("all");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await matchingApi.getLeads();
      const list = (res as any)?.data || res || [];
      setLeads(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load provider leads", err);
      // Fallback to provider feed
      try {
        const feedRes = await projectApi.listProviderFeed();
        const feedList = (feedRes as any)?.data || feedRes || [];
        setLeads(Array.isArray(feedList) ? feedList : []);
      } catch (feedErr) {
        toast.error("Failed to load matched leads.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filter helper functions
  const isDirectQuoteLead = (match: ProjectMatch) => {
    const project = match.project;
    if (!project) return false;
    const matchReason = typeof match.match_reason === "string" ? match.match_reason : JSON.stringify(match.match_reason || "");
    return (
      project.request_type === "direct_quote" ||
      Boolean(project.invited_provider_id) ||
      matchReason.includes("direct_quote")
    );
  };

  const isQuotedLead = (match: ProjectMatch) => {
    const project = match.project;
    const matchStatus = String(match.status || "").toLowerCase();
    const projectStatus = String(project?.status || "").toLowerCase();
    return (
      matchStatus === "quoted" ||
      matchStatus === "accepted" ||
      matchStatus === "in_progress" ||
      matchStatus === "proposals_received" ||
      projectStatus === "proposals_received" ||
      projectStatus === "in_progress" ||
      Boolean(project?.accepted_proposal_id)
    );
  };

  // Counts
  const directLeadsCount = leads.filter(isDirectQuoteLead).length;
  const openLeadsCount = leads.filter((m) => !isDirectQuoteLead(m)).length;
  const awaitingQuoteCount = leads.filter((m) => !isQuotedLead(m)).length;

  // Filtered by active tab
  const tabFilteredLeads = leads.filter((match) => {
    if (activeTab === "direct") return isDirectQuoteLead(match);
    if (activeTab === "open") return !isDirectQuoteLead(match);
    return true;
  });

  const needsQuoteLeads = tabFilteredLeads.filter((m) => !isQuotedLead(m));
  const quotedLeads = tabFilteredLeads.filter((m) => isQuotedLead(m));

  const renderLeadCard = (match: ProjectMatch) => {
    const project = match.project;
    if (!project) return null;

    const isDirect = isDirectQuoteLead(match);
    const requestTypeLabel = isDirect ? "Direct Quote" : "Custom Request";
    const isQuoted = isQuotedLead(match);
    const statusLabel = isQuoted ? "Quote Received" : "Quote Pending";

    // Customer Name
    const customerName =
      (project as any).customer?.full_name ||
      (project as any).customer?.user?.full_name ||
      (project.customer_id ? `Customer #${project.customer_id}` : "Customer");

    // Relative Time
    const timeAgo = project.createdAt
      ? formatRelativeDate(project.createdAt)
      : "Recently";

    // Preferred Date
    const dateStr = project.preferred_date
      ? formatDate(project.preferred_date, "MMM d, yyyy")
      : "Flexible Date";

    // Urgency / Time Slot
    const urgencyLabel = project.urgency
      ? project.urgency.charAt(0).toUpperCase() + project.urgency.slice(1)
      : "Any time";

    // Budget
    const budgetStr =
      project.budget_min || project.budget_max
        ? `${usd(project.budget_min || 0)} - ${usd(project.budget_max || 0)}`
        : "Open Quote";

    return (
      <div
        key={match.id}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
      >
        <div>
          {/* Header Badges & Ref */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600 border border-rose-100">
                {requestTypeLabel}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  isQuoted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {statusLabel}
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">
              CSR-{project.id}
            </span>
          </div>

          {/* Project Title */}
          <h3
            onClick={() => navigate(`/provider/custom-requests/${project.id}`)}
            className="font-display text-base font-bold text-slate-900 group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
          >
            {project.title}
          </h3>

          {/* Submitter Info */}
          <p className="mt-1 text-xs text-slate-500">
            {customerName} · submitted {timeAgo}
          </p>

          {/* Description */}
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Meta Information */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400 shrink-0" />
              {dateStr}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400 shrink-0" />
              {urgencyLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
              <DollarSign size={14} className="text-slate-400 shrink-0" />
              {budgetStr}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/provider/custom-requests/${project.id}`)}
            className="rounded-xl text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View request
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Custom Quotes & Leads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {awaitingQuoteCount} awaiting your quote · {directLeadsCount} direct quote requests
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeads}
          disabled={loading}
          className="gap-2 text-xs rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary" : "text-slate-500"} />
          Refresh Leads
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
            activeTab === "all"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Layers size={14} className="text-slate-500" />
          All Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab("direct")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
            activeTab === "direct"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <FileText size={14} className="text-slate-500" />
          Direct Quote Requests ({directLeadsCount})
        </button>
        <button
          onClick={() => setActiveTab("open")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
            activeTab === "open"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Sparkles size={14} className="text-slate-500" />
          Open Quote Leads ({openLeadsCount})
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-slate-500">Finding matched opportunities for you...</p>
        </div>
      ) : tabFilteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <EmptyState
            icon={FileQuestion}
            title="No matched leads found"
            description="New project requests are posted daily. Make sure your services, coverage radius, and category settings are up to date."
            action={
              <Button onClick={() => navigate("/provider/profile")} variant="outline" className="rounded-xl">
                Update Profile Settings
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Needs a quote */}
          {needsQuoteLeads.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                Needs a quote
              </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {needsQuoteLeads.map(renderLeadCard)}
              </div>
            </div>
          )}

          {/* Section 2: Quoted & in progress */}
          {quotedLeads.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                Quoted & in progress
              </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {quotedLeads.map(renderLeadCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderLeads;

