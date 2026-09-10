import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { projectApi } from "@/services/project";
import type { Project } from "@/types/api/project";
import { formatDate } from "@/utils/date";
import toast from "react-hot-toast";

export const CustomerProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.listMine();
      const list = (res as any)?.data || res || [];
      setProjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load custom requests", err);
      toast.error("Failed to load custom requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatSubmittedTime = (createdAt?: string) => {
    if (!createdAt) return "recently";
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(date, "MMM d");
  };

  return (
    <div>
      {/* Page Header matching exact reference UI */}
      <PageHeader
        title="Custom Service Requests"
        subtitle="Requirements that fall outside a professional's standard service list"
        action={
          <Button onClick={() => navigate("/search")}>
            Find a Professional
          </Button>
        }
      />

      {/* Requests Grid matching reference CustomRequestCard UI */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading custom requests...</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No custom requests yet"
          description="Open a professional's profile and use 'Custom Service Request' when your job isn't on their price list."
          action={
            <Button onClick={() => navigate("/search")}>
              Browse Professionals
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            const dateStr = project.preferred_date
              ? formatDate(project.preferred_date, "MMM d, yyyy")
              : "Flexible Date";

            const submittedAgo = formatSubmittedTime(project.createdAt);

            const providerOrCategory =
              project.invited_provider?.business_name ||
              project.category?.name ||
              project.service_type?.name ||
              "Local Professional";

            const statusLabel =
              project.status === "matching" || project.status === "open"
                ? "Quote Pending"
                : project.status === "proposals_received"
                ? "Quotes Received"
                : project.status === "accepted" || project.status === "scheduled"
                ? "Scheduled"
                : project.status === "completed"
                ? "Completed"
                : project.status || "Quote Pending";

            return (
              <div
                key={project.id}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                {/* Card Top Row: Custom request badge, Status pill, CSR ID */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
                    Custom request
                  </span>
                  <StatusPill status={statusLabel} />
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    CSR-{project.id}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-3 font-display text-base font-bold leading-snug line-clamp-1 text-slate-900">
                  {project.title}
                </h3>

                {/* Subtitle: Provider/Category + submitted time */}
                <p className="mt-1 text-xs text-muted-foreground">
                  {providerOrCategory} · submitted {submittedAgo}
                </p>

                {/* Description */}
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {project.description}
                </p>

                {/* Meta details row */}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-slate-400 shrink-0" /> {dateStr}
                  </span>
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Clock size={14} className="text-slate-400 shrink-0" /> {project.urgency || "Morning (8am – 12pm)"}
                  </span>
                </div>

                {/* Action Footer */}
                <div className="mt-5 border-t border-border pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs px-4 py-2"
                  >
                    View request
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onProjectCreated={(id) => {
          fetchProjects();
          navigate(`/projects/${id}`);
        }}
      />
    </div>
  );
};

export default CustomerProjects;
