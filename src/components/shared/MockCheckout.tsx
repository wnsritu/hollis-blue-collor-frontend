import { CheckCircle2, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

export type CheckoutLine = { label: string; value: number; muted?: boolean };

export function CheckoutPanel({
  title,
  subtitle,
  lines,
  total,
  cta = "Pay Securely",
  onSuccess,
  footnote,
}: {
  title: string;
  subtitle?: string;
  lines: CheckoutLine[];
  total: number;
  cta?: string;
  onSuccess: () => void;
  footnote?: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState("4242 4242 4242 4242");

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 1100);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Payment method</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your credit card or payment details below to complete your order securely.
        </p>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="card">Card number</Label>
            <div className="relative">
              <CreditCard
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="card"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                inputMode="numeric"
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="exp">Expiry</Label>
              <Input id="exp" defaultValue="09 / 29" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" defaultValue="123" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">Billing ZIP</Label>
              <Input id="zip" defaultValue="78704" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name on card</Label>
            <Input id="name" defaultValue="ABC Plumbing Co." />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
          <ShieldCheck size={14} className="text-success" /> Secure 256-bit SSL encrypted transaction.
        </div>
      </div>

      <div className="h-max rounded-2xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <dl className="mt-5 space-y-3 text-sm">
          {lines.map((l) => (
            <div key={l.label} className="flex items-center justify-between gap-3">
              <dt className={l.muted ? "text-muted-foreground" : ""}>{l.label}</dt>
              <dd className={l.muted ? "text-muted-foreground" : "font-medium"}>{usd(l.value)}</dd>
            </div>
          ))}
        </dl>
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total due</span>
          <span className="font-display text-2xl font-bold">{usd(total)}</span>
        </div>
        <Button size="lg" className="mt-5 w-full" onClick={pay} disabled={processing}>
          {processing ? (
            "Processing…"
          ) : (
            <>
              <Lock size={16} /> {cta}
            </>
          )}
        </Button>
        {footnote && <p className="mt-3 text-center text-xs text-muted-foreground">{footnote}</p>}
      </div>
    </div>
  );
}

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  rows,
  action,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  rows: { label: string; value: string }[];
  action: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <dl className="mt-4 divide-y divide-border rounded-xl border border-border bg-muted/40 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="text-right font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2">{action}</div>
      </DialogContent>
    </Dialog>
  );
}
