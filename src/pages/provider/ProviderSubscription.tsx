import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { CheckoutPanel } from "@/components/shared/MockCheckout";
import { subscriptionApi } from "@/services/payment/payment.service";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

interface UIPlan {
  id: number | string;
  name: string;
  price: number;
  currency?: string;
  billing_interval?: string;
  description: string;
  features: string[];
  is_active: boolean;
  proposal_limit?: number | null;
  featured_credits?: number;
  popular?: boolean;
}

export const ProviderSubscription = () => {
  const [plans, setPlans] = useState<UIPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<UIPlan | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        subscriptionApi.getActivePublicPlans(),
        subscriptionApi.getProviderSubscription(),
      ]);

      if (plansRes.status === "fulfilled" && plansRes.value) {
        const val: any = plansRes.value;
        const rawPlans = Array.isArray(val.data)
          ? val.data
          : Array.isArray(val?.data?.data)
            ? val.data.data
            : Array.isArray(val)
              ? val
              : [];

        const formattedPlans: UIPlan[] = rawPlans.map((p: any) => {
          let parsedFeatures: string[] = [];
          if (Array.isArray(p.features)) {
            parsedFeatures = p.features;
          } else if (typeof p.features === "string") {
            try {
              parsedFeatures = JSON.parse(p.features);
            } catch {
              parsedFeatures = p.features.split(",").map((s: string) => s.trim());
            }
          }
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            currency: p.currency || "usd",
            billing_interval: p.billing_interval || "month",
            description: p.description || "",
            features: parsedFeatures,
            is_active: Boolean(p.is_active ?? true),
            proposal_limit: p.proposal_limit,
            featured_credits: p.featured_credits ?? 0,
            popular: p.name?.toLowerCase().includes("professional") || p.slug === "professional",
          };
        });
        setPlans(formattedPlans);
      }

      if (subRes.status === "fulfilled" && subRes.value) {
        const val: any = subRes.value;
        const subData = val?.data?.subscription ? val.data : val?.data?.data ? val.data.data : val?.data || val;
        setCurrentSub(subData);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activePlanId = currentSub?.subscription?.plan_id || currentSub?.plan?.id;
  const currentPlanName = currentSub?.subscription?.plan?.name || currentSub?.plan?.name || "No Plan";
  const currentPlanPrice = Number(currentSub?.subscription?.plan?.price || currentSub?.plan?.price || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Subscription" subtitle="Your plan controls proposal volume, visibility and support." />
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
                <h2 className="mt-1 font-display text-2xl font-bold">{currentPlanName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {usd(currentPlanPrice)}/month · status: {currentSub?.subscription?.status || "active"}
                </p>
              </div>
              <StatusPill status={currentSub?.subscription?.status === "inactive" ? "Inactive" : "Active"} />
            </div>
            <Separator className="my-5" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Proposals used", `${currentSub?.proposals_used ?? 0} proposal(s)`],
                ["Featured credits", `${currentSub?.featured_credits ?? 0} remaining`],
                ["Billing Interval", "Monthly"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-sm font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </section>

          <h2 className="mt-8 font-display text-xl font-bold">Available plans</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {plans
              .filter((p) => p.is_active)
              .map((p) => {
                const isCurrent = Number(p.id) === Number(activePlanId);
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card ${
                      p.popular ? "border-accent shadow-elevated" : "border-border"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-sm">
                        Most popular
                      </span>
                    )}
                    <h3 className="font-display text-lg font-bold">{p.name}</h3>
                    <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                      {usd(p.price)}
                      <span className="text-sm font-medium text-muted-foreground">/mo</span>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                    <ul className="mt-4 flex-1 space-y-2 text-sm">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-5"
                      variant={isCurrent ? "outline" : "secondary"}
                      disabled={isCurrent}
                      onClick={() => setPending(p)}
                    >
                      {isCurrent ? "Current plan" : `Switch to ${p.name}`}
                    </Button>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <Dialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm plan change</DialogTitle>
          </DialogHeader>
          {pending && (
            <CheckoutPanel
              title={`${pending.name} plan — monthly`}
              subtitle="Billed monthly, cancel anytime."
              lines={[{ label: `${pending.name} subscription`, value: pending.price }]}
              total={pending.price}
              cta={`Pay ${usd(pending.price)} and switch`}
              onSuccess={() => {
                setPending(null);
                toast.success(`You're on the ${pending.name} plan`);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderSubscription;
