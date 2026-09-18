import React, { useState } from "react";
import { Plus, CreditCard, Users, Wallet } from "lucide-react";
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
import { PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";

export interface SubPlan {
  id: string;
  name: string;
  price: number;
  cycle: string;
  description: string;
  features: string[];
  subscribers: number;
  active: boolean;
}

const initialPlans: SubPlan[] = [
  {
    id: "plan_basic",
    name: "Starter Pro",
    price: 29,
    cycle: "Monthly",
    description: "Essential tools for individual independent providers.",
    features: ["Up to 10 job bids / mo", "Standard directory placement", "Basic analytics"],
    subscribers: 42,
    active: true,
  },
  {
    id: "plan_pro",
    name: "Professional Growth",
    price: 79,
    cycle: "Monthly",
    description: "Expanded reach for established local service companies.",
    features: [
      "Unlimited job bids",
      "Priority directory search placement",
      "SMS lead instant alerts",
      "Verified Pro badge",
    ],
    subscribers: 128,
    active: true,
  },
  {
    id: "plan_enterprise",
    name: "Business Enterprise",
    price: 199,
    cycle: "Monthly",
    description: "Full multi-team dispatch and premium marketing suite.",
    features: [
      "Dedicated account manager",
      "Top spot homepage feature",
      "API & Custom integrations",
      "0% platform transaction fee discount",
    ],
    subscribers: 15,
    active: true,
  },
];

export function AdminSubscriptions() {
  const [plans, setPlans] = useState<SubPlan[]>(initialPlans);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "49", description: "", features: "" });

  const mrr = plans.reduce((s, p) => s + (p.active ? p.price * p.subscribers : 0), 0);
  const subs = plans.reduce((s, p) => s + p.subscribers, 0);

  const updatePlan = (id: string, updates: Partial<SubPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    toast.success("Plan updated successfully");
  };

  const createPlan = () => {
    if (!form.name.trim()) return;
    const newPlan: SubPlan = {
      id: `plan_${Date.now()}`,
      name: form.name,
      price: Number(form.price),
      cycle: "Monthly",
      description: form.description,
      features: form.features.split("\n").filter(Boolean),
      subscribers: 0,
      active: true,
    };
    setPlans((prev) => [...prev, newPlan]);
    setOpen(false);
    setForm({ name: "", price: "49", description: "", features: "" });
    toast.success("Subscription plan created!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        subtitle="Recurring revenue and provider membership options"
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={16} /> New Plan
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Monthly Recurring Revenue"
          value={usd(mrr)}
          hint="Active memberships"
          icon={Wallet}
          tone="success"
        />
        <StatCard label="Total Subscribers" value={subs.toLocaleString()} hint="All active plans" icon={Users} />
        <StatCard
          label="Active Plans"
          value={plans.filter((p) => p.active).length}
          hint={`Out of ${plans.length} total plans`}
          icon={CreditCard}
          tone="accent"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <StatusPill status={p.active ? "Active" : "Inactive"} />
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={`price-${p.id}`} className="text-xs text-muted-foreground">
                Monthly Price ($)
              </Label>
              <Input
                id={`price-${p.id}`}
                type="number"
                value={p.price}
                onChange={(e) => updatePlan(p.id, { price: Number(e.target.value) })}
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{p.description}</p>

            <div className="mt-4 flex-1">
              <p className="text-xs font-bold text-foreground mb-1">Features:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">•</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold">{p.subscribers} subscribers</span>
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
            <DialogTitle>New Subscription Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pn">Plan Name</Label>
              <Input
                id="pn"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Executive Pro"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pp">Monthly Price ($)</Label>
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
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of target audience"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf">Features (One per line)</Label>
              <Textarea
                id="pf"
                rows={4}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
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

export default AdminSubscriptions;
