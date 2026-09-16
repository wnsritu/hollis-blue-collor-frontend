import React, { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";

export interface FeaturedPlanItem {
  id: string;
  name: string;
  price: number;
  days: number;
  benefits: string[];
  active: boolean;
  purchases: number;
}

const initialFeaturedPlans: FeaturedPlanItem[] = [
  {
    id: "fp_7d",
    name: "7-Day Top Search Boost",
    price: 19,
    days: 7,
    benefits: [
      "Top 3 category search result position",
      "Highlighted gold badge on listing card",
      "Push notification feature to local leads",
    ],
    active: true,
    purchases: 84,
  },
  {
    id: "fp_14d",
    name: "14-Day Power Promotion",
    price: 35,
    days: 14,
    benefits: [
      "Top search placement for 2 full weeks",
      "Homepage featured pro highlight",
      "Featured badge on customer quote requests",
    ],
    active: true,
    purchases: 51,
  },
  {
    id: "fp_30d",
    name: "30-Day Market Leader",
    price: 65,
    days: 30,
    benefits: [
      "Full monthly premier visibility boost",
      "Dedicated banner on category landing page",
      "Priority customer lead dispatch",
    ],
    active: true,
    purchases: 29,
  },
];

export function AdminFeaturedPlans() {
  const [featuredPlans, setFeaturedPlans] = useState<FeaturedPlanItem[]>(initialFeaturedPlans);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "19", days: "7", benefits: "" });

  const revenue = featuredPlans.reduce((s, p) => s + p.price * p.purchases, 0);

  const updatePlan = (id: string, updates: Partial<FeaturedPlanItem>) => {
    setFeaturedPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    toast.success("Featured plan updated!");
  };

  const createPlan = () => {
    if (!form.name.trim()) return;
    const newPlan: FeaturedPlanItem = {
      id: `fp_${Date.now()}`,
      name: form.name,
      price: Number(form.price),
      days: Number(form.days),
      benefits: form.benefits.split("\n").filter(Boolean),
      active: true,
      purchases: 0,
    };
    setFeaturedPlans((prev) => [...prev, newPlan]);
    setOpen(false);
    setForm({ name: "", price: "19", days: "7", benefits: "" });
    toast.success("Featured plan created!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Featured Plans & Boost Packages"
        subtitle={`${usd(revenue)} in total visibility boost revenue`}
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={16} /> New Featured Plan
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {featuredPlans.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                <Sparkles size={13} /> {p.days} Days Boost
              </span>
              <StatusPill status={p.active ? "Active" : "Inactive"} />
            </div>

            <h3 className="mt-4 font-display text-lg font-bold">{p.name}</h3>

            <div className="mt-3 grid gap-2">
              <Label htmlFor={`fp-${p.id}`} className="text-xs text-muted-foreground">
                Package Price ($)
              </Label>
              <Input
                id={`fp-${p.id}`}
                type="number"
                value={p.price}
                onChange={(e) => updatePlan(p.id, { price: Number(e.target.value) })}
              />
            </div>

            <ul className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">
              {p.benefits.map((b, idx) => (
                <li key={idx} className="flex items-baseline gap-1.5">
                  <span className="text-amber-500 font-bold">•</span> {b}
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold">{p.purchases} total purchases</span>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <span>Active</span>
                <Switch checked={p.active} onCheckedChange={(v) => updatePlan(p.id, { active: v })} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Featured Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fn">Name</Label>
              <Input
                id="fn"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 1-Month Spotlight"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fpr">Price ($)</Label>
                <Input
                  id="fpr"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fd">Duration (Days)</Label>
                <Input
                  id="fd"
                  type="number"
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fb">Benefits (One per line)</Label>
              <Textarea
                id="fb"
                rows={4}
                value={form.benefits}
                onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                placeholder="Benefit 1&#10;Benefit 2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createPlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminFeaturedPlans;
