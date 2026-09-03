import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Briefcase,
  CalendarDays,
  MapPin,
  Clock,
  MessageSquare,
  ChevronRight,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill, EmptyState } from "@/components/shared/primitives";
import { CreateProjectModal } from "@/components/m3/CreateProjectModal";
import { projectApi } from "@/api/modules/project.api";
import type { Project } from "@/types/api/project";
import { usd } from "@/components/shared/cards";
import toast from "react-hot-toast";

export const CustomerProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.listMine();
      const list = (res as any)?.data || res || [];
      setProjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load customer projects", err);
      toast.error("Failed to load your projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return p.status === "open" || p.status === "matching";
    if (activeTab === "proposals") return p.status === "proposals_received";
    if (activeTab === "scheduled") return p.status === "accepted" || p.status === "scheduled" || p.status === "in_progress";
    if (activeTab === "completed") return p.status === "completed";
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">My Project Requests</h1>
          <p className="text-sm text-muted-foreground">
            Manage your requested jobs, review proposals from verified pros, and track progress.
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus size={16} /> Post New Project
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-3 mb-6 scrollbar-none">
        {[
          { id: "all", label: "All Projects" },
          { id: "open", label: "Open & Matching" },
          { id: "proposals", label: "Proposals Received" },
          { id: "scheduled", label: "Scheduled / In Progress" },
          { id: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your project requests...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No project requests found"
          description={
            activeTab === "all"
              ? "You haven't posted any projects yet. Create a project to receive custom quotes from local pros!"
              : `No projects currently in ${activeTab.replace("_", " ")} status.`
          }
          action={
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus size={16} /> Post a Project Now
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const dateStr = project.preferred_date
              ? new Date(project.preferred_date).toLocaleDateString()
              : "Flexible";
            const budgetStr =
              project.budget_min || project.budget_max
                ? `${usd(project.budget_min || 0)} - ${usd(project.budget_max || 0)}`
                : "Budget TBD";

            return (
              <div
                key={project.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      #{project.id}
                    </span>
                    <StatusPill status={project.status || "open"} />
                  </div>

                  <h3 className="font-display text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
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
                      <span className="font-semibold text-foreground">{budgetStr}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs capitalize font-medium text-muted-foreground">
                    Urgency: <span className="font-bold text-foreground">{project.urgency || "soon"}</span>
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="gap-1 text-xs"
                  >
                    View Details <ChevronRight size={14} />
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
