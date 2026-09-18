import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { CheckoutPanel } from "@/components/shared/MockCheckout";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

const plans = [
  {
    id: "plan_starter",
    name: "Starter",
    price: 29,
    cycle: "Monthly",
    description: "For solo pros getting their first steady stream of leads.",
    features: ["10 proposals per month", "Standard profile listing", "Customer messaging", "Email support"],
    active: true,
  },
  {
    id: "plan_pro",
    name: "Professional",
    price: 59,
    cycle: "Monthly",
    description: "For growing crews that need volume and visibility.",
    features: [
      "Unlimited proposals",
      "Verified badge eligibility",
      "Priority in search results",
      "Portfolio gallery",
      "Phone + email support",
    ],
    active: true,
    popular: true,
  },
  {
    id: "plan_business",
    name: "Business",
    price: 99,
    cycle: "Monthly",
    description: "For multi-truck operations covering several service areas.",
    features: [
      "Everything in Professional",
      "Up to 5 service areas",
      "2 featured listing credits per month",
      "Team seats",
      "Dedicated account manager",
    ],
    active: true,
  },
];

export const ProviderSubscription = () => {
  const [activePlanId, setActivePlanId] = useState("plan_pro");
  const [pending, setPending] = useState<string | null>(null);

  const current = plans.find((p) => p.id === activePlanId);
  const target = plans.find((p) => p.id === pending);

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription" subtitle="Your plan controls proposal volume, visibility and support." />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{current?.name ?? "No plan"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {usd(current?.price ?? 0)}/month · member since Jan 15, 2026 · renews Oct 1, 2026
            </p>
          </div>
          <StatusPill status="Active" />
        </div>
        <Separator className="my-5" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Proposals used", "18 of unlimited"],
            ["Featured credits", "1 remaining"],
            ["Next invoice", `${usd(current?.price ?? 0)} on Oct 1, 2026`],
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
          .filter((p) => p.active)
          .map((p) => {
            const isCurrent = p.id === activePlanId;
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
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  variant={isCurrent ? "outline" : "secondary"}
                  disabled={isCurrent}
                  onClick={() => setPending(p.id)}
                >
                  {isCurrent ? "Current plan" : `Switch to ${p.name}`}
                </Button>
              </div>
            );
          })}
      </div>

      <Dialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm plan change</DialogTitle>
          </DialogHeader>
          {target && (
            <CheckoutPanel
              title={`${target.name} plan — monthly`}
              subtitle="Billed monthly, cancel anytime."
              lines={[{ label: `${target.name} subscription`, value: target.price }]}
              total={target.price}
              cta={`Pay ${usd(target.price)} and switch`}
              onSuccess={() => {
                setActivePlanId(target.id);
                setPending(null);
                toast.success(`You're on the ${target.name} plan`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderSubscription;
