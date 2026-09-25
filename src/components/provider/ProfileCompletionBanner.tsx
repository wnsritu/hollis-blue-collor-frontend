import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Sparkles,
  Tags,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useProviderCompletion } from "@/hooks/useProviderCompletion";
import type { ProfileCompletionStep } from "@/utils/providerProfileCompletion";

interface ProfileCompletionBannerProps {
  currentTab?: string;
  onSelectTab?: (tab: "info" | "bank" | "faqs") => void;
  className?: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  business_info: Building2,
  bank_details: CreditCard,
  faqs: HelpCircle,
  services_pricing: Tags,
  availability: CalendarDays,
};

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({
  currentTab = "info",
  onSelectTab,
  className,
}) => {
  const navigate = useNavigate();
  const { completion, isComplete, percentage, steps } = useProviderCompletion();

  const handleStepClick = (step: ProfileCompletionStep) => {
    if (step.tabKey && onSelectTab) {
      onSelectTab(step.tabKey);
    } else {
      navigate(step.route);
    }
  };

  return (
    <div
      className={`rounded-3xl border shadow-xs overflow-hidden transition-all duration-300 ${
        isComplete
          ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-card border-emerald-500/30"
          : "bg-gradient-to-br from-card via-card to-muted/30 border-border"
      } ${className || ""}`}
    >
      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid size-10 place-items-center rounded-2xl ${
                isComplete
                  ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isComplete ? <CheckCircle2 size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
                {isComplete ? "Profile Completed" : "Profile Completion Progress"}
                {isComplete && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    100% Ready
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isComplete
                  ? "All 5 required sections are completed. Your profile is active and ready for bookings."
                  : "Complete all 5 required sections below to unlock all platform features and receive customer requests."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full ${
                isComplete
                  ? "bg-emerald-500 text-white shadow-xs"
                  : percentage >= 40
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {percentage}% Complete ({completion.completedCount}/5 steps)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <Progress
            value={percentage}
            className="h-2.5 bg-muted rounded-full overflow-hidden"
            indicatorClassName={
              isComplete
                ? "bg-emerald-500"
                : percentage >= 40
                ? "bg-amber-500"
                : "bg-red-500"
            }
          />
        </div>

        {/* 5 Step Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {steps.map((step, idx) => {
            const Icon = STEP_ICONS[step.id] || Building2;
            const isCurrentActiveTab =
              (step.tabKey && currentTab === step.tabKey) ||
              (step.id === "services_pricing" && window.location.pathname.includes("pricing")) ||
              (step.id === "availability" && window.location.pathname.includes("availability"));

            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step)}
                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isCurrentActiveTab
                    ? "ring-2 ring-primary/80 border-primary bg-primary/5 shadow-xs"
                    : step.completed
                    ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-background/80 border-border hover:border-foreground/30 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`grid size-7 place-items-center rounded-xl text-xs font-bold ${
                      step.completed
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                    }`}
                  >
                    {step.completed ? <CheckCircle2 size={15} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      step.completed
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {step.completed ? "Done" : "Pending"}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {step.shortTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;
