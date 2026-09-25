import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Lock,
  LogOut,
  Sparkles,
  Tags,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProviderCompletion } from "@/hooks/useProviderCompletion";
import { useAuthSession } from "@/hooks/useAuth";
import type { ProfileCompletionStep } from "@/utils/providerProfileCompletion";

interface ProfileCompletionModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  canDismiss?: boolean;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  business_info: Building2,
  bank_details: CreditCard,
  faqs: HelpCircle,
  services_pricing: Tags,
  availability: CalendarDays,
};

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  open,
  onOpenChange,
  canDismiss = false,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuthSession();
  const { completion, isComplete, percentage, steps, firstIncompleteStep, closeModal } =
    useProviderCompletion();

  const handleStepClick = (step: ProfileCompletionStep) => {
    closeModal();
    if (onOpenChange) onOpenChange(false);
    navigate(step.route);
  };

  const handleContinue = () => {
    closeModal();
    if (onOpenChange) onOpenChange(false);
    if (firstIncompleteStep) {
      navigate(firstIncompleteStep.route);
    } else {
      navigate("/provider/profile");
    }
  };

  const handleSignOut = async () => {
    closeModal();
    if (onOpenChange) onOpenChange(false);
    await logout();
    navigate("/login", { replace: true });
  };

  if (isComplete) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (canDismiss && onOpenChange) {
          onOpenChange(val);
        }
      }}
    >
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden border border-border shadow-2xl rounded-3xl"
        onInteractOutside={(e) => {
          if (!canDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!canDismiss) e.preventDefault();
        }}
      >
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-br from-red-500/10 via-amber-500/5 to-background p-6 pb-5 border-b border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400">
              <Lock size={12} /> Complete Profile 1st
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {completion.completedCount} of {completion.totalCount} completed
            </span>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Complete Your Profile First
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            You must fill your profile information, bank details, FAQs, pricing, and availability before you can access the platform features.
          </DialogDescription>

          {/* Progress Bar & Percentage Pill */}
          <div className="mt-4 p-3 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" /> Profile Completion
              </span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  percentage >= 80
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : percentage >= 40
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                }`}
              >
                {percentage}% Completed
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-2.5 bg-muted rounded-full overflow-hidden"
              indicatorClassName={
                percentage >= 80
                  ? "bg-emerald-500"
                  : percentage >= 40
                  ? "bg-amber-500"
                  : "bg-red-500"
              }
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-2.5">
          {steps.map((step, idx) => {
            const Icon = STEP_ICONS[step.id] || Building2;
            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(step)}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  step.completed
                    ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-card border-border hover:border-primary hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-xl font-bold transition-colors ${
                      step.completed
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                    }`}
                  >
                    {step.completed ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        Step {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {step.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {step.completed ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-semibold px-2.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                    >
                      {step.actionLabel}
                      <ChevronRight size={13} className="ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 text-xs font-semibold"
          >
            <LogOut size={14} /> Sign out
          </Button>

          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto gap-2 text-xs font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {firstIncompleteStep ? `Fill ${firstIncompleteStep.shortTitle}` : "Go to Profile"}
            <ChevronRight size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;
