import { Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckoutPanel } from "@/components/shared/MockCheckout";
import { PageHeader, StatusPill } from "@/components/shared/primitives";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

const featuredPlans = [
  { id: "fp_7", name: "Featured 7 Days", price: 19, days: 7, benefits: ["Top of category results", "Featured badge", "Homepage rotation"], active: true },
  { id: "fp_14", name: "Featured 14 Days", price: 29, days: 14, benefits: ["Top of category results", "Featured badge", "Homepage rotation", "Search boost in 2 ZIPs"], active: true },
  { id: "fp_30", name: "Featured 30 Days", price: 49, days: 30, benefits: ["Top of category results", "Featured badge", "Homepage rotation", "Search boost in 5 ZIPs", "Weekly performance recap"], active: true },
];

const initialListings = [
  { id: "FL-4398", target: "Comfort HVAC", type: "Provider", owner: "Comfort HVAC", plan: "Featured 30 Days", spend: 49, starts: "Aug 10, 2026", expires: "Sep 9, 2026", status: "Active" },
  { id: "FL-4371", target: "ABC Plumbing Co.", type: "Provider", owner: "ABC Plumbing Co.", plan: "Featured 14 Days", spend: 29, starts: "Jul 20, 2026", expires: "Aug 3, 2026", status: "Expired" },
];

export const ProviderFeatured = () => {
  const [listings, setListings] = useState(initialListings);
  const [pending, setPending] = useState<string | null>(null);

  const plan = featuredPlans.find((p) => p.id === pending);

  const handlePurchase = (p: typeof featuredPlans[0]) => {
    const newListing = {
      id: `FL-${4500 + listings.length}`,
      target: "ABC Plumbing Co.",
      type: "Provider",
      owner: "ABC Plumbing Co.",
      plan: p.name,
      spend: p.price,
      starts: "Today",
      expires: `In ${p.days} days`,
      status: "Active",
    };
    setListings([newListing, ...listings]);
    setPending(null);
    toast.success("Featured listing active", { description: "Your profile now ranks above standard results." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Featured listings" subtitle="Appear above standard results in your category and ZIP codes." />

      <div className="grid gap-4 md:grid-cols-3">
        {featuredPlans
          .filter((p) => p.active)
          .map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
              <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-soft-foreground">
                <Sparkles size={13} /> {p.days} days
              </span>
              <h3 className="mt-3 font-display text-lg font-bold">{p.name}</h3>
              <p className="mt-1 font-display text-3xl font-extrabold text-primary">{usd(p.price)}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {p.benefits.map((b) => (
                  <li key={b}>· {b}</li>
                ))}
              </ul>
              <Button variant="secondary" className="mt-5" onClick={() => setPending(p.id)}>
                Feature my business
              </Button>
            </div>
          ))}
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-card">
        <h2 className="px-6 pt-5 font-display text-lg font-bold">My featured listings</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.target}</TableCell>
                  <TableCell>{l.plan}</TableCell>
                  <TableCell className="text-right">{usd(l.spend)}</TableCell>
                  <TableCell>{l.starts}</TableCell>
                  <TableCell>{l.expires}</TableCell>
                  <TableCell>
                    <StatusPill status={l.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase featured placement</DialogTitle>
          </DialogHeader>
          {plan && (
            <CheckoutPanel
              title={`${plan.name} — ABC Plumbing Co.`}
              subtitle={`${plan.days} days of boosted placement.`}
              lines={[{ label: plan.name, value: plan.price }]}
              total={plan.price}
              cta={`Pay ${usd(plan.price)}`}
              onSuccess={() => handlePurchase(plan)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderFeatured;
