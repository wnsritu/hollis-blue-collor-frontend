import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { getPlatformSettings, updatePlatformSettings } from "@/services/admin/admin.service";

export function splitAmount(amount: number, rate: number = 5) {
  const commission = Math.round((amount * rate) / 100 * 100) / 100;
  const payable = Math.max(0, amount - commission);
  return { commission, payable };
}

export function AdminCommission() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionRate, setCommissionRate] = useState(5);
  const [rate, setRate] = useState([5]);
  const [platformFee, setPlatformFee] = useState("10");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res: any = await getPlatformSettings();
      const data = res?.data?.settings || res?.data || res?.settings || res;
      if (data) {
        const comm = Number(data.admin_commission) || 5;
        const fee = data.platform_fee !== undefined ? String(data.platform_fee) : "10";
        setCommissionRate(comm);
        setRate([comm]);
        setPlatformFee(fee);
      }
    } catch (err) {
      console.error("Failed to load platform settings:", err);
      toast.error("Failed to load platform commission settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        admin_commission: rate[0],
        platform_fee: Number(platformFee) || 0,
      };
      await updatePlatformSettings(payload);
      setCommissionRate(rate[0]);
      toast.success(`Platform settings saved successfully!`, {
        description: `Commission set to ${rate[0]}% and platform fee set to ${usd(Number(platformFee) || 0)}.`,
      });
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update platform settings.");
    } finally {
      setSaving(false);
    }
  };

  const mockGrossVolume = 14500;
  const projected = Math.round(((mockGrossVolume * rate[0]) / 100) * 100) / 100;

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading commission settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission & Platform Fees"
        subtitle="Applies to every completed job across the marketplace."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Global Commission Rate</h2>
            <span className="font-display text-4xl font-extrabold text-primary">{rate[0]}%</span>
          </div>
          <Slider
            className="mt-6"
            value={rate}
            onValueChange={(val) => setRate(val)}
            min={0}
            max={30}
            step={0.5}
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>30%</span>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="platformFee">Platform Flat Fee ($)</Label>
              <Input
                id="platformFee"
                type="number"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exact">Exact Rate (%)</Label>
              <Input
                id="exact"
                type="number"
                step="0.5"
                value={rate[0]}
                onChange={(e) => setRate([Number(e.target.value)])}
              />
            </div>
          </div>

          <Button
            className="mt-6 gap-2"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Settings…
              </>
            ) : (
              "Save Commission Rate"
            )}
          </Button>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            Changing the commission rate or platform fee updates active calculations across the marketplace.
          </div>
        </section>

        <aside className="h-max space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-base font-bold">Impact Preview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Processed Monthly Volume", usd(mockGrossVolume)],
                ["Current Active Rate", `${commissionRate}%`],
                ["New Proposed Rate", `${rate[0]}%`],
                ["Platform Flat Fee", usd(Number(platformFee) || 0)],
                ["Projected Commission", usd(projected)],
                ["Paid to Providers", usd(mockGrossVolume - projected)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-base font-bold">Example Split</h2>
            <p className="mt-2 text-sm text-muted-foreground">On a {usd(1000)} job:</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Platform Commission ({rate[0]}%)</span>
                <span className="font-semibold text-primary">
                  {usd(splitAmount(1000, rate[0]).commission)}
                </span>
              </li>
              {Number(platformFee) > 0 && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Platform Flat Fee</span>
                  <span className="font-semibold text-primary">
                    {usd(Number(platformFee))}
                  </span>
                </li>
              )}
              <li className="flex justify-between pt-1 border-t border-border">
                <span className="text-muted-foreground">Provider Pay</span>
                <span className="font-semibold text-green-600">
                  {usd(splitAmount(1000, rate[0]).payable)}
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AdminCommission;
