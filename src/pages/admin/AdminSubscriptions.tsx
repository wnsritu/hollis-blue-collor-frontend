import React, { useCallback, useEffect, useState } from "react";
import { Plus, CreditCard, Users, Wallet, Loader2, RefreshCw, Trash2, X, Edit3, CheckCircle2, Sparkles } from "lucide-react";
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

const FEATURE_PRESETS = [
  "10 Proposals per month",
  "Unlimited Customer Messaging",
  "Standard Profile Listing",
  "Verified Provider Badge",
  "Priority Lead Matching",
  "Portfolio Showcase",
  "Dedicated Email Support",
  "Featured Search Placement",
];

export function AdminSubscriptions() {
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [mrr, setMrr] = useState<number>(0);
  const [totalSubscribers, setTotalSubscribers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    price: "49",
    description: "",
    proposal_limit: "10",
    isUnlimited: false,
    featuresList: [] as string[],
  });
  const [newFeatureInput, setNewFeatureInput] = useState("");

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
            price: Number(p.price) >= 0 ? Number(p.price) : 0,
            currency: p.currency || "usd",
            billing_interval: p.billing_interval || "month",
            description: p.description || "",
            features: Array.isArray(featArr) ? featArr : [],
            subscribers: p.subscriber_count || 0,
            active: Boolean(p.is_active),
            sort_order: p.sort_order || 0,
            proposal_limit: p.proposal_limit != null && p.proposal_limit >= 0 ? p.proposal_limit : null,
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

  const handleOpenNewModal = () => {
    setEditingPlanId(null);
    setForm({
      name: "",
      price: "49",
      description: "",
      proposal_limit: "10",
      isUnlimited: false,
      featuresList: [
        "Proposals per month",
        "Customer messaging",
        "Standard profile listing",
        "Email support",
      ],
    });
    setNewFeatureInput("");
    setOpen(true);
  };

  const handleOpenEditModal = (plan: SubPlan) => {
    setEditingPlanId(plan.id);
    setForm({
      name: plan.name,
      price: String(plan.price),
      description: plan.description || "",
      proposal_limit: plan.proposal_limit != null ? String(plan.proposal_limit) : "10",
      isUnlimited: plan.proposal_limit == null,
      featuresList: plan.features || [],
    });
    setNewFeatureInput("");
    setOpen(true);
  };

  const updatePlanStatus = async (id: number | string, active: boolean) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
    try {
      await adminUpdateSubscriptionPlanStatus(id, active);
      toast.success("Plan status updated");
    } catch (err: any) {
      console.error("Update plan status error:", err);
      toast.error(err?.response?.data?.message || "Failed to update status.");
      loadData();
    }
  };

  const updatePlanInlinePrice = async (id: number | string, rawVal: string) => {
    const parsed = Math.max(0, parseFloat(rawVal) || 0);
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, price: parsed } : p)));
    try {
      await adminUpdateSubscriptionPlan(id, { price: parsed });
      toast.success("Price updated");
    } catch (err: any) {
      console.error("Update plan price error:", err);
      toast.error("Failed to update price.");
      loadData();
    }
  };

  // Feature Builder Handlers
  const addFeatureItem = (feat: string) => {
    const trimmed = feat.trim();
    if (!trimmed) return;
    if (form.featuresList.includes(trimmed)) {
      toast.error("Feature already added.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      featuresList: [...prev.featuresList, trimmed],
    }));
    setNewFeatureInput("");
  };

  const handleFeaturePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted && (pasted.includes("\n") || pasted.includes(","))) {
      e.preventDefault();
      const items = pasted
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = Array.from(new Set([...form.featuresList, ...items]));
      setForm((prev) => ({ ...prev, featuresList: unique }));
      setNewFeatureInput("");
      toast.success(`Added ${items.length} features`);
    }
  };

  const removeFeatureItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      featuresList: prev.featuresList.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPlan = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a plan name.");
      return;
    }

    const priceNum = Math.max(0, parseFloat(form.price) || 0);
    const proposalLimitVal = form.isUnlimited
      ? null
      : Math.max(0, parseInt(form.proposal_limit, 10) || 0);

    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        price: priceNum,
        currency: "usd",
        billing_interval: "month",
        proposal_limit: proposalLimitVal,
        description: form.description.trim() || null,
        features: form.featuresList,
        is_active: true,
      };

      if (editingPlanId) {
        await adminUpdateSubscriptionPlan(editingPlanId, payload);
        toast.success("Plan updated successfully");
      } else {
        await adminCreateSubscriptionPlan({
          ...payload,
          sort_order: plans.length + 1,
        });
        toast.success("Plan created successfully");
      }

      setOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Save plan error:", err);
      toast.error(err?.response?.data?.message || "Failed to save subscription plan.");
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
            <Button onClick={handleOpenNewModal} className="gap-2">
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
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{p.name}</h3>
                  {p.proposal_limit != null ? (
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                      {p.proposal_limit} proposals/mo
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                      Unlimited proposals
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleOpenEditModal(p)}
                    title="Edit Plan"
                  >
                    <Edit3 size={14} />
                  </Button>
                  <StatusPill status={p.active ? "Active" : "Inactive"} />
                </div>
              </div>

              <div className="mt-3 grid gap-1.5">
                <Label htmlFor={`price-${p.id}`} className="text-xs text-muted-foreground">
                  Monthly price ($)
                </Label>
                <Input
                  id={`price-${p.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  value={p.price}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    updatePlanInlinePrice(p.id, String(val));
                  }}
                  className="font-medium text-sm"
                />
              </div>

              {p.description ? (
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              ) : null}

              <div className="mt-4 pt-3 border-t border-border flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Features ({p.features.length})
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground max-h-[140px] overflow-y-auto pr-1">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">
                  {p.subscribers} subscriber{p.subscribers === 1 ? "" : "s"}
                </p>

                <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                  <span>Active</span>
                  <Switch
                    checked={p.active}
                    onCheckedChange={(v) => updatePlanStatus(p.id, v)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingPlanId ? "Edit Subscription Plan" : "New Subscription Plan"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 text-sm">
            {/* Plan Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="pn">Plan name *</Label>
              <Input
                id="pn"
                placeholder="e.g. Starter Pro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Monthly Price */}
            <div className="grid gap-1.5">
              <Label htmlFor="pp">Monthly price ($) *</Label>
              <Input
                id="pp"
                type="number"
                min="0"
                step="0.01"
                placeholder="49"
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                value={form.price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || parseFloat(val) >= 0) {
                    setForm({ ...form, price: val.replace("-", "") });
                  }
                }}
              />
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label htmlFor="pd">Description</Label>
              <Input
                id="pd"
                placeholder="e.g. Ideal for solo workers & small teams"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Proposal Limit */}
            <div className="grid gap-2 border border-border/60 p-3 rounded-xl bg-muted/20">
              <div className="flex items-center justify-between">
                <Label htmlFor="pl" className="font-semibold">
                  Proposal Limit (per month)
                </Label>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="unlimited-prop"
                    checked={form.isUnlimited}
                    onChange={(e) => setForm({ ...form, isUnlimited: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  <Label htmlFor="unlimited-prop" className="text-xs font-medium cursor-pointer">
                    Unlimited Proposals
                  </Label>
                </div>
              </div>

              {!form.isUnlimited && (
                <div className="mt-1">
                  <Input
                    id="pl"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="10"
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") e.preventDefault();
                    }}
                    value={form.proposal_limit}
                    onChange={(e) => {
                      const val = e.target.value.replace("-", "");
                      setForm({ ...form, proposal_limit: val });
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Maximum number of proposal quotes this plan user can send per billing cycle.
                  </p>
                </div>
              )}
            </div>

            {/* Rich Feature Builder UI */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Plan Features ({form.featuresList.length})</Label>
                <span className="text-[11px] text-muted-foreground">Add features or pick presets</span>
              </div>

              {/* Added Features Chip List */}
              <div className="min-h-[60px] p-2.5 rounded-xl border border-border bg-background space-y-1.5">
                {form.featuresList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3 italic">
                    No features added yet. Type a feature below or click a preset badge.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {form.featuresList.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 group transition-all"
                      >
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => removeFeatureItem(idx)}
                          className="text-primary/70 hover:text-destructive focus:outline-none"
                          title="Remove feature"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Feature Input */}
              <div className="flex items-center gap-2 mt-1">
                <Input
                  placeholder="Type a feature and press Enter or paste list..."
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onPaste={handleFeaturePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeatureItem(newFeatureInput);
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addFeatureItem(newFeatureInput)}
                  className="shrink-0 text-xs gap-1"
                >
                  <Plus size={14} /> Add
                </Button>
              </div>

              {/* Quick Feature Presets */}
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">Quick Feature Presets:</p>
                <div className="flex flex-wrap gap-1">
                  {FEATURE_PRESETS.map((preset, idx) => {
                    const isAdded = form.featuresList.includes(preset);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAdded}
                        onClick={() => addFeatureItem(preset)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                          isAdded
                            ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
                            : "bg-card hover:bg-primary/10 text-foreground border-border hover:border-primary/40 cursor-pointer"
                        }`}
                      >
                        + {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPlan} disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingPlanId ? "Update plan" : "Create plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSubscriptions;
