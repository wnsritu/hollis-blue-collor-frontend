import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { MockNotice, PageHeader } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";

export function splitAmount(amount: number, rate: number = 15) {
  const commission = Math.round((amount * rate) / 100);
  const payable = amount - commission;
  return { commission, payable };
}

export function AdminCommission() {
  const [commissionRate, setCommissionRate] = useState(15);
  const [rate, setRate] = useState([15]);
  const [minFee, setMinFee] = useState("5");

  const mockGrossVolume = 14500;
  const projected = (mockGrossVolume * rate[0]) / 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission"
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
              <Label htmlFor="min">Minimum Service Fee ($)</Label>
              <Input
                id="min"
                type="number"
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
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
            className="mt-6"
            onClick={() => {
              setCommissionRate(rate[0]);
              toast.success(`Commission set to ${rate[0]}%`, {
                description: "All new and existing transaction splits are recalculated.",
              });
            }}
          >
            Save Commission Rate
          </Button>

          <div className="mt-6">
            <MockNotice>
              Changing the rate instantly recalculates active payout figures across the platform.
            </MockNotice>
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
                <span className="text-muted-foreground">Platform Take</span>
                <span className="font-semibold text-primary">
                  {usd(splitAmount(1000, rate[0]).commission)}
                </span>
              </li>
              <li className="flex justify-between">
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
