import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { subscriptionApi } from "@/services/payment";
import { getWalletCoins } from "@/services/provider";
import StripeSubscriptionModal from "@/components/payment/StripeSubscriptionModal";

export interface PlanData {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  price: number | string;
  currency?: string;
  billing_interval?: string;
  duration_days?: number;
  proposal_limit?: number | null;
  featured_credits?: number;
  features?: string[] | string | null;
  sort_order?: number;
  popular?: boolean;
}

export interface SubscriptionData {
  id: number;
  provider_id: number;
  plan_id: number;
  status: string;
  start_date?: string;
  end_date?: string;
  createdAt?: string;
  plan?: PlanData;
}

export interface UsageData {
  proposals_used: number;
  proposal_limit: number | null;
  proposals_remaining?: number | null;
  featured_credits_remaining: number;
}

export default function ProviderSubscriptionPage() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [usage, setUsage] = useState<UsageData>({
    proposals_used: 0,
    proposal_limit: null,
    featured_credits_remaining: 0,
  });

  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stripe Checkout Modal state
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, plansRes, coinsRes] = await Promise.all([
        subscriptionApi.getProviderSubscription().catch(() => null),
        subscriptionApi.getActivePublicPlans().catch(() => null),
        getWalletCoins().catch(() => null),
      ]);

      // Set coins
      setCoins(coinsRes?.data?.available_balance || 0);

      // Set active plans
      const rawPlans = plansRes?.data?.data || plansRes?.data || [];
      const activePlansList: PlanData[] = Array.isArray(rawPlans) ? rawPlans : [];
      setPlans(activePlansList);

      // Set current subscription & usage
      const subPayload =
        subRes?.data?.subscription
          ? subRes.data
          : subRes?.data?.data?.subscription
          ? subRes.data.data
          : subRes?.subscription
          ? subRes
          : subRes?.data?.data || subRes?.data || subRes;

      if (subPayload) {
        setSubscription(subPayload.subscription || null);
        setCurrentPlan(subPayload.plan || subPayload.subscription?.plan || null);
        if (subPayload.usage) {
          setUsage(subPayload.usage);
        }
      }
    } catch (err) {
      console.error("Failed to load provider subscription:", err);
      toast.error("Failed to load subscription information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Open Checkout Modal for a target plan
  const handleSelectPlan = (plan: PlanData) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const parseFeatures = (features: any): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === "string") {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [features];
      } catch {
        return [features];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading subscription status...</p>
      </div>
    );
  }

  const startDateFormatted = formatDate(subscription?.start_date || subscription?.createdAt);
  const nextBillingFormatted = formatDate(subscription?.end_date);
  const subStatus = subscription?.status
    ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
    : "Inactive";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        subtitle="Your plan controls proposal volume, visibility and support."
      />

      {/* Current Plan Card Section */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Current plan
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-foreground">
              {currentPlan?.name ?? "No plan"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {usd(Number(currentPlan?.price ?? 0))}/month · member since {startDateFormatted} · renews {nextBillingFormatted}
            </p>
          </div>
          <StatusPill status={subStatus} />
        </div>

        <Separator className="my-5" />

        {/* 3 Stat Metrics */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Proposals used</p>
            <p className="text-sm font-semibold text-foreground">
              {usage.proposals_used} of {usage.proposal_limit === null ? "unlimited" : usage.proposal_limit}
              {usage.proposals_remaining !== null && usage.proposals_remaining !== undefined ? ` (${usage.proposals_remaining} left)` : ""}
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Featured credits</p>
            <p className="text-sm font-semibold text-foreground">
              {usage.featured_credits_remaining} remaining
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Next invoice</p>
            <p className="text-sm font-semibold text-foreground">
              {usd(Number(currentPlan?.price ?? 0))} on {nextBillingFormatted}
            </p>
          </div>
        </div>
      </section>

      {/* Available Plans Section */}
      <h2 className="mt-8 font-display text-xl font-bold text-foreground">Available plans</h2>
      
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = currentPlan?.id === p.id || subscription?.plan_id === p.id;
          const isPopular = p.popular || p.sort_order === 2 || p.slug === "professional";
          const featuresList = parseFeatures(p.features);

          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all ${
                isPopular
                  ? "border-primary shadow-elevated ring-1 ring-primary/20"
                  : "border-border"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                  Most popular
                </span>
              )}

              <h3 className="font-display text-lg font-bold text-foreground">{p.name}</h3>

              <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                {usd(Number(p.price))}
                <span className="text-sm font-medium text-muted-foreground">/mo</span>
              </p>

              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground/90">
                {featuresList.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-5 w-full font-semibold"
                variant={isCurrent ? "outline" : "secondary"}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(p)}
              >
                {isCurrent ? "Current plan" : `Switch to ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Stripe Checkout Modal */}
      {selectedPlan && (
        <StripeSubscriptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plan={selectedPlan}
          coins={coins}
          onSuccess={() => {
            setIsModalOpen(false);
            loadSubscriptionData();
            toast.success(`You are now subscribed to the ${selectedPlan.name} plan!`, {
              description: "Your new proposal benefits are active immediately.",
            });
          }}
        />
      )}
    </div>
  );
}
