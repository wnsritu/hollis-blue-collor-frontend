import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
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
  const [platformFee, setPlatformFee] = useState("0");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res: any = await getPlatformSettings();
      const data = res?.data?.settings || res?.data || res?.settings || res;
      if (data) {
        const comm = Number(data.admin_commission) || 5;
        const fee = data.platform_fee !== undefined ? String(data.platform_fee) : "0";
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
    const finalRate = Math.max(0, Math.min(100, Number(rate[0]) || 0));
    const finalFee = Math.max(0, Number(platformFee) || 0);

    setSaving(true);
    try {
      const payload = {
        admin_commission: finalRate,
        platform_fee: finalFee,
      };
      await updatePlatformSettings(payload);
      setCommissionRate(finalRate);
      setRate([finalRate]);
      setPlatformFee(String(finalFee));
      toast.success(`Platform settings saved successfully! Commission: ${finalRate}%.`);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update platform settings.");
    } finally {
      setSaving(false);
    }
  };

  const safeRate = Math.max(0, Math.min(100, Number(rate[0]) || 0));
  const safeFlatFee = Math.max(0, Number(platformFee) || 0);

  const mockGrossVolume = 14500;
  const projected = Math.round(((mockGrossVolume * safeRate) / 100) * 100) / 100;
  const paidToProviders = Math.max(0, Math.round((mockGrossVolume - projected - safeFlatFee) * 100) / 100);

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
            <span className="font-display text-4xl font-extrabold text-primary">{safeRate}%</span>
          </div>
          <Slider
            className="mt-6"
            value={[safeRate]}
            onValueChange={(val) => setRate([Math.max(0, Math.min(100, val[0]))])}
            min={0}
            max={30}
            step={0.5}
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>30%</span>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 max-w-md">
            {/* Commented out as per SOW requirement - single percentage-based commission model.
            <div className="grid gap-2">
              <Label htmlFor="platformFee">Platform Flat Fee ($)</Label>
              <Input
                id="platformFee"
                type="number"
                min="0"
                step="1"
                value={platformFee}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                }}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  const val = parseFloat(cleaned);
                  if (isNaN(val) || val < 0) {
                    setPlatformFee(cleaned === "" ? "" : "0");
                  } else {
                    setPlatformFee(cleaned);
                  }
                }}
                onBlur={() => {
                  const val = parseFloat(platformFee);
                  if (isNaN(val) || val < 0) {
                    setPlatformFee("0");
                  } else {
                    setPlatformFee(String(val));
                  }
                }}
              />
            </div>
            */}
            <div className="grid gap-2">
              <Label htmlFor="exact">Exact Rate (%)</Label>
              <Input
                id="exact"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={safeRate}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
                }}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  const val = parseFloat(cleaned);
                  if (isNaN(val) || val < 0) {
                    setRate([0]);
                  } else {
                    setRate([Math.min(100, val)]);
                  }
                }}
                onBlur={() => {
                  const val = Number(rate[0]);
                  if (isNaN(val) || val < 0) {
                    setRate([0]);
                  } else if (val > 100) {
                    setRate([100]);
                  }
                }}
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
            Changing the commission rate updates active calculations across the marketplace.
          </div>
        </section>

        <aside className="h-max space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-base font-bold">Impact Preview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Processed Monthly Volume", usd(mockGrossVolume)],
                ["Current Active Rate", `${commissionRate}%`],
                ["New Proposed Rate", `${safeRate}%`],
                // ["Platform Flat Fee", usd(safeFlatFee)], // Commented out flat fee row
                ["Projected Commission", usd(projected)],
                ["Paid to Providers", usd(paidToProviders)],
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
                <span className="text-muted-foreground">Platform Commission ({safeRate}%)</span>
                <span className="font-semibold text-primary">
                  {usd(splitAmount(1000, safeRate).commission)}
                </span>
              </li>
              {/* Commented out Platform Flat Fee line in Example Split
              {safeFlatFee > 0 && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Platform Flat Fee</span>
                  <span className="font-semibold text-primary">
                    {usd(safeFlatFee)}
                  </span>
                </li>
              )}
              */}
              <li className="flex justify-between pt-1 border-t border-border">
                <span className="text-muted-foreground">Provider Pay</span>
                <span className="font-semibold text-green-600">
                  {usd(Math.max(0, 1000 - splitAmount(1000, safeRate).commission - safeFlatFee))}
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
