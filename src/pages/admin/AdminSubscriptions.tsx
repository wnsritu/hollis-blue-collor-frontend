import React, { useCallback, useEffect, useState } from "react";
import { Plus, CreditCard, Users, Wallet, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import {
  adminListSubscriptionPlans,
  adminGetSubscriptionOverview,
  adminCreateSubscriptionPlan,
  adminUpdateSubscriptionPlan,
  adminUpdateSubscriptionPlanStatus,
} from "@/services/admin";

export interface SubPlan {
  id: number | string;
  name: string;
  price: number;
  currency?: string;
  billing_interval?: string;
  description: string;
  features: string[];
  subscribers: number;
  active: boolean;
  sort_order?: number;
  proposal_limit?: number | null;
  featured_credits?: number;
}

export function AdminSubscriptions() {
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [mrr, setMrr] = useState<number>(0);
  const [totalSubscribers, setTotalSubscribers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", price: "49", description: "", proposal_limit: "10", isUnlimited: false, features: "" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, listRes] = await Promise.all([
        adminGetSubscriptionOverview().catch(() => null),
        adminListSubscriptionPlans({ limit: 100 }).catch(() => null),
      ]);

      if (overviewRes?.data?.data) {
        const ov = overviewRes.data.data;
        setMrr(ov.monthly_recurring_revenue || 0);
        setTotalSubscribers(ov.total_subscribers || 0);
      }

      const rawPlans = listRes?.data?.data?.plans || listRes?.data?.data || [];
      if (Array.isArray(rawPlans)) {
        const mappedPlans: SubPlan[] = rawPlans.map((p: any) => {
          let featArr: string[] = [];
          if (Array.isArray(p.features)) featArr = p.features;
          else if (typeof p.features === "string") {
            try {
              featArr = JSON.parse(p.features);
            } catch {
              featArr = [p.features];
            }
          }

          return {
            id: p.id,
            name: p.name || "Unnamed Plan",
            price: Number(p.price) || 0,
            currency: p.currency || "usd",
            billing_interval: p.billing_interval || "month",
            description: p.description || "",
            features: Array.isArray(featArr) ? featArr : [],
            subscribers: p.subscriber_count || 0,
            active: Boolean(p.is_active),
            sort_order: p.sort_order || 0,
            proposal_limit: p.proposal_limit,
            featured_credits: p.featured_credits || 0,
          };
        });

        setPlans(mappedPlans);

        if (!overviewRes?.data?.data) {
          const calcMrr = mappedPlans.reduce(
            (acc, p) => acc + (p.active ? p.price * p.subscribers : 0),
            0
          );
          const calcSubs = mappedPlans.reduce((acc, p) => acc + p.subscribers, 0);
          setMrr(calcMrr);
          setTotalSubscribers(calcSubs);
        }
      }
    } catch (err: any) {
      console.error("Failed to load subscription plans:", err);
      toast.error("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updatePlan = async (id: number | string, updates: Partial<SubPlan>) => {
    // Optimistic state update
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      if (updates.active !== undefined) {
        await adminUpdateSubscriptionPlanStatus(id, updates.active);
      }
      if (updates.price !== undefined || updates.name !== undefined) {
        const payload: Record<string, any> = {};
        if (updates.price !== undefined) payload.price = updates.price;
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.description !== undefined) payload.description = updates.description;
        await adminUpdateSubscriptionPlan(id, payload);
      }
      toast.success("Plan updated");
    } catch (err: any) {
      console.error("Update plan error:", err);
      toast.error(err?.response?.data?.message || "Failed to update plan.");
      loadData();
    }
  };

  const create = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a plan name.");
      return;
    }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    try {
      setSubmitting(true);
      const featureList = form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const proposalLimitVal = form.isUnlimited
        ? null
        : form.proposal_limit && !isNaN(Number(form.proposal_limit))
        ? Number(form.proposal_limit)
        : null;

      await adminCreateSubscriptionPlan({
        name: form.name.trim(),
        price: priceNum,
        currency: "usd",
        billing_interval: "month",
        proposal_limit: proposalLimitVal,
        description: form.description.trim() || null,
        features: featureList,
        is_active: true,
        sort_order: plans.length + 1,
      });

      setOpen(false);
      setForm({ name: "", price: "49", description: "", proposal_limit: "10", isUnlimited: false, features: "" });
      toast.success("Plan created");
      loadData();
    } catch (err: any) {
      console.error("Create plan error:", err);
      toast.error(err?.response?.data?.message || "Failed to create plan.");
    } finally {
      setSubmitting(false);
    }
  };

  const activePlansCount = plans.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription plans"
        subtitle="Recurring revenue from provider memberships"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              className="gap-1.5 text-xs"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus size={16} /> New plan
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Monthly recurring revenue"
          value={usd(mrr)}
          hint="Active plans"
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Total subscribers"
          value={totalSubscribers.toLocaleString()}
          hint="All plans"
          icon={Users}
        />
        <StatCard
          label="Plans"
          value={plans.length}
          hint={`${activePlansCount} active`}
          icon={CreditCard}
          tone="accent"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
          <Loader2 size={32} className="animate-spin text-primary mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Loading plans...</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-foreground">{p.name}</h3>
                <StatusPill status={p.active ? "Active" : "Inactive"} />
              </div>

              <div className="mt-3 grid gap-2">
                <Label htmlFor={`price-${p.id}`} className="text-xs text-muted-foreground">
                  Monthly price
                </Label>
                <Input
                  id={`price-${p.id}`}
                  type="number"
                  value={p.price}
                  onChange={(e) => updatePlan(p.id, { price: Number(e.target.value) })}
                  className="font-medium text-sm"
                />
              </div>

              {p.description ? (
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              ) : null}

              <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-foreground font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-sm font-semibold text-foreground">
                {p.subscribers} subscriber{p.subscribers === 1 ? "" : "s"}
              </p>

              <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                <span>Plan active</span>
                <Switch
                  checked={p.active}
                  onCheckedChange={(v) => updatePlan(p.id, { active: v })}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New subscription plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pn">Plan name</Label>
              <Input
                id="pn"
                placeholder="e.g. Starter Pro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pp">Monthly price</Label>
              <Input
                id="pp"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pd">Description</Label>
              <Input
                id="pd"
                placeholder="Target provider description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pl">Proposal limit (per month)</Label>
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    id="unlimited-prop"
                    checked={form.isUnlimited}
                    onChange={(e) => setForm({ ...form, isUnlimited: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <Label htmlFor="unlimited-prop" className="text-xs font-normal cursor-pointer">
                    Unlimited
                  </Label>
                </div>
              </div>
              {!form.isUnlimited && (
                <Input
                  id="pl"
                  type="number"
                  placeholder="10"
                  value={form.proposal_limit}
                  onChange={(e) => setForm({ ...form, proposal_limit: e.target.value })}
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf">Features (one per line)</Label>
              <Textarea
                id="pf"
                rows={4}
                placeholder="10 proposals per month&#10;Standard profile listing&#10;Customer messaging"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={create} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null} Create plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubscriptions;
