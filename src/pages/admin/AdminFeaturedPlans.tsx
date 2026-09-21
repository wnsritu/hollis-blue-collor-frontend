import React, { useEffect, useState } from "react";
import { Plus, Sparkles, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import {
  getAdminFeaturedPlans,
  createFeaturedPlan,
  updateFeaturedPlan,
  deleteFeaturedPlan,
} from "@/services/featured/featured.service";
import { STANDARD_FEATURED_BENEFITS } from "@/constants/featured";
import type { FeaturedPlanItem } from "@/types/featured";

export function AdminFeaturedPlans() {
  const [featuredPlans, setFeaturedPlans] = useState<FeaturedPlanItem[]>([]);
  const [lifetimeRevenue, setLifetimeRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state for creating new plan
  const [form, setForm] = useState({
    name: "",
    price: "19",
    days: "7",
    selectedBenefits: [
      STANDARD_FEATURED_BENEFITS[0],
      STANDARD_FEATURED_BENEFITS[1],
    ] as string[],
  });

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await getAdminFeaturedPlans();
      if (res?.data) {
        setFeaturedPlans(res.data.plans || []);
        setLifetimeRevenue(res.data.lifetime_revenue || 0);
      }
    } catch (err: any) {
      console.error("Failed to load featured plans:", err);
      toast.error(err?.message || "Failed to load featured plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handlePriceChange = async (id: number | string, newPrice: number) => {
    // Optimistic UI update
    setFeaturedPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: newPrice } : p))
    );

    try {
      await updateFeaturedPlan(id, { price: newPrice });
      toast.success("Plan price updated");
    } catch (err: any) {
      console.error("Failed to update price:", err);
      toast.error("Failed to update price");
      loadPlans();
    }
  };

  const handleToggleActive = async (id: number | string, active: boolean) => {
    // Optimistic update
    setFeaturedPlans((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_active: active, active } : p
      )
    );

    try {
      await updateFeaturedPlan(id, { is_active: active });
      toast.success(`Plan ${active ? "activated" : "deactivated"}`);
    } catch (err: any) {
      console.error("Failed to update plan status:", err);
      toast.error("Failed to update plan status");
      loadPlans();
    }
  };

  const [deletingPlan, setDeletingPlan] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;
    try {
      setIsDeleting(true);
      await deleteFeaturedPlan(deletingPlan.id);
      toast.success("Featured plan deleted successfully");
      setDeletingPlan(null);
      await loadPlans();
    } catch (err: any) {
      console.error("Failed to delete plan:", err);
      toast.error(err?.message || "Failed to delete featured plan");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleBenefitCheckbox = (benefit: string) => {
    setForm((prev) => {
      const exists = prev.selectedBenefits.includes(benefit);
      return {
        ...prev,
        selectedBenefits: exists
          ? prev.selectedBenefits.filter((b) => b !== benefit)
          : [...prev.selectedBenefits, benefit],
      };
    });
  };

  const handleCreatePlan = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a plan name");
      return;
    }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    const daysNum = Number(form.days);
    if (isNaN(daysNum) || daysNum < 1) {
      toast.error("Please enter a valid duration (minimum 1 day)");
      return;
    }

    const allBenefits = [...form.selectedBenefits];

    if (allBenefits.length === 0) {
      toast.error("Please select at least one benefit");
      return;
    }

    try {
      setCreating(true);
      await createFeaturedPlan({
        name: form.name.trim(),
        price: priceNum,
        duration_days: daysNum,
        benefits: allBenefits,
        is_active: true,
      });

      toast.success("Featured plan created successfully!");
      setOpen(false);
      setForm({
        name: "",
        price: "19",
        days: "7",
        selectedBenefits: [
          STANDARD_FEATURED_BENEFITS[0],
          STANDARD_FEATURED_BENEFITS[1],
        ],
      });
      await loadPlans();
    } catch (err: any) {
      console.error("Failed to create plan:", err);
      toast.error(err?.message || "Failed to create featured plan");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Featured plans"
        subtitle={`${usd(lifetimeRevenue)} in lifetime boost revenue`}
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus size={16} /> New featured plan
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : featuredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-card">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">
            No featured plans found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            There are no featured plans currently created. Click "+ New featured plan" above to create dynamic pricing and boost packages.
          </p>
          <Button onClick={() => setOpen(true)} className="mt-5 gap-2">
            <Plus size={16} /> Create your first plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {featuredPlans.map((p) => {
            const isActive = p.active ?? p.is_active;
            const days = p.days ?? p.duration_days;
            const benefitsList = Array.isArray(p.benefits) ? p.benefits : [];

            return (
              <div
                key={p.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-100">
                    <Sparkles size={13} /> {days} days
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusPill status={isActive ? "Active" : "Inactive"} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingPlan({ id: p.id, name: p.name })}
                      title="Delete plan"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <h3 className="mt-3 font-display text-lg font-bold">{p.name}</h3>

                <div className="mt-3 grid gap-2">
                  <Label
                    htmlFor={`fp-${p.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Price
                  </Label>
                  <Input
                    id={`fp-${p.id}`}
                    type="number"
                    value={p.price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFeaturedPlans((prev) =>
                        prev.map((item) =>
                          item.id === p.id ? { ...item, price: val } : item
                        )
                      );
                    }}
                    onBlur={(e) => handlePriceChange(p.id, Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                  {benefitsList.map((b, idx) => (
                    <li key={idx}>· {b}</li>
                  ))}
                </ul>

                <p className="mt-3 text-sm font-semibold">
                  {p.purchases || 0} purchases
                </p>

                <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                  <span className="font-medium text-foreground">Plan active</span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(v) => handleToggleActive(p.id, v)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}

      {/* New Featured Plan Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              New featured plan
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fn" className="text-sm font-semibold">
                Plan Name
              </Label>
              <Input
                id="fn"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Featured 7 Days"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fpr" className="text-sm font-semibold">
                  Price ($)
                </Label>
                <Input
                  id="fpr"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="19"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fd" className="text-sm font-semibold">
                  Duration (days)
                </Label>
                <Input
                  id="fd"
                  type="number"
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                  placeholder="7"
                />
              </div>
            </div>

            {/* 5 Benefits Checkboxes as requested */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">
                Benefits (Select all that apply)
              </Label>
              <div className="space-y-2 rounded-xl border border-border p-3 bg-muted/20">
                {STANDARD_FEATURED_BENEFITS.map((benefit) => {
                  const checked = form.selectedBenefits.includes(benefit);
                  return (
                    <label
                      key={benefit}
                      className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBenefitCheckbox(benefit)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{benefit}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reusable Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingPlan)}
        onOpenChange={(isOpen) => !isOpen && setDeletingPlan(null)}
        title="Delete Featured Plan"
        description={`Are you sure you want to delete "${deletingPlan?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default AdminFeaturedPlans;
