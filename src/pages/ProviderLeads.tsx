import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  MapPin,
  CalendarDays,
  Clock,
  DollarSign,
  ChevronRight,
  Loader2,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill, EmptyState } from "@/components/shared/primitives";
import { SubmitProposalModal } from "@/components/m3/SubmitProposalModal";
import { matchingApi } from "@/api/modules/matching.api";
import { projectApi } from "@/api/modules/project.api";
import type { ProjectMatch } from "@/types/api/matching";
import { usd } from "@/components/shared/cards";
import toast from "react-hot-toast";

export const ProviderLeads: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ProjectMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Proposal modal state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ProjectMatch | null>(null);

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

  const handleOpenPropose = (match: ProjectMatch) => {
    setSelectedMatch(match);
    setProposalModalOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Matched Opportunities & Leads</h1>
          <p className="text-sm text-muted-foreground">
            Projects matched to your skills, category, and service radius by our matching engine.
          </p>
        </div>
        <Button variant="outline" onClick={fetchLeads} className="gap-2 text-xs">
          <Sparkles size={14} className="text-accent" /> Refresh Leads
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Finding matched opportunities for you...</p>
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No matched leads right now"
          description="New project requests are posted daily. Make sure your services, coverage radius, and category settings are up to date."
          action={
            <Button onClick={() => navigate("/provider/profile")} variant="outline">
              Update Profile Settings
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((match) => {
            const project = match.project;
            if (!project) return null;

            const score = match.score || 0;
            const reasons = Array.isArray(match.match_reasons) ? match.match_reasons : [];
            const dateStr = project.preferred_date
              ? new Date(project.preferred_date).toLocaleDateString()
              : "Flexible";
            const budgetStr =
              project.budget_min || project.budget_max
                ? `${usd(project.budget_min || 0)} - ${usd(project.budget_max || 0)}`
                : "Open Quote";

            return (
              <div
                key={match.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-soft-foreground">
                      <Sparkles size={12} className="text-accent" /> {score}% Match
                    </span>
                    <StatusPill status={project.status || "open"} />
                  </div>

                  <h3 className="font-display text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>

                  {/* Match Reasons */}
                  {reasons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {reasons.map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          <CheckCircle2 size={11} className="text-success" />
                          {r.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Location & Details */}
                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0 text-primary" />
                      <span className="truncate">
                        {[project.address_line, project.city, project.state]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="shrink-0" /> {dateStr}
                      </span>
                      <span className="font-bold text-foreground">{budgetStr}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex-1 text-xs"
                  >
                    View Project
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenPropose(match)}
                    className="flex-1 text-xs gap-1"
                  >
                    Submit Proposal <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Proposal Modal */}
      {selectedMatch && selectedMatch.project && (
        <SubmitProposalModal
          open={proposalModalOpen}
          onOpenChange={setProposalModalOpen}
          projectId={selectedMatch.project.id}
          projectTitle={selectedMatch.project.title}
          onProposalSubmitted={fetchLeads}
        />
      )}
    </div>
  );
};

export default ProviderLeads;
