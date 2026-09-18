import { Link } from "react-router-dom";
import { Banknote, Briefcase, Percent, Receipt, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

const commissionRate = 10;

const revenueSeries = [
  { month: "Feb", revenue: 21400, commission: 2140, jobs: 186 },
  { month: "Mar", revenue: 26800, commission: 2680, jobs: 214 },
  { month: "Apr", revenue: 31250, commission: 3125, jobs: 248 },
  { month: "May", revenue: 29700, commission: 2970, jobs: 236 },
  { month: "Jun", revenue: 38900, commission: 3890, jobs: 297 },
  { month: "Jul", revenue: 44300, commission: 4430, jobs: 338 },
  { month: "Aug", revenue: 51600, commission: 5160, jobs: 391 },
];

const providerGrowth = [
  { month: "Feb", providers: 620, customers: 2840 },
  { month: "Mar", providers: 688, customers: 3180 },
  { month: "Apr", providers: 742, customers: 3610 },
  { month: "May", providers: 811, customers: 4022 },
  { month: "Jun", providers: 905, customers: 4588 },
  { month: "Jul", providers: 1014, customers: 5240 },
  { month: "Aug", providers: 1148, customers: 6015 },
];

const pendingProviders = [
  {
    id: "keystone-remodeling",
    name: "Keystone Remodeling",
    category: "Remodeling",
    city: "Portland",
    state: "OR",
    status: "Pending",
  },
];

const transactions = [
  { id: "TRX-77201", customer: "Marcus Bell", provider: "BrightHome Cleaning", amount: 285, status: "Paid", date: "Aug 12, 2026" },
  { id: "TRX-77198", customer: "Daniel Ortiz", provider: "GreenPro Landscaping", amount: 6400, status: "Paid", date: "Aug 19, 2026" },
  { id: "TRX-77205", customer: "Sarah Whitfield", provider: "Summit Electric", amount: 1650, status: "Paid", date: "Aug 21, 2026" },
  { id: "TRX-77188", customer: "Marcus Bell", provider: "ABC Plumbing Co.", amount: 500, status: "Paid", date: "Aug 8, 2026" },
  { id: "TRX-77210", customer: "Priya Raman", provider: "Comfort HVAC", amount: 940, status: "Pending", date: "Aug 24, 2026" },
];

export const AdminDashboard = () => {
  const gmv = 51600;
  const commission = 5160;
  const pendingPayoutsTotal = 8050;
  const max = Math.max(...revenueSeries.map((r) => r.revenue));
  const maxUsers = Math.max(...providerGrowth.map((g) => g.customers));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        subtitle="August 2026 platform activity & summary"
        action={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/commission">
                <Percent size={16} /> Commission
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/payouts">
                <Banknote size={16} /> Release payouts
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Gross marketplace volume" value={usd(gmv)} hint="Paid transactions" icon={Receipt} />
        <StatCard label="Commission revenue" value={usd(commission)} hint={`${commissionRate}% take rate`} icon={Percent} tone="accent" />
        <StatCard label="Active jobs" value={8} hint="All statuses" icon={Briefcase} />
        <StatCard label="Providers / customers" value="8 / 8" hint="Registered accounts" icon={Users} />
        <StatCard label="Pending payouts" value={usd(pendingPayoutsTotal)} hint="4 awaiting release" icon={Banknote} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Revenue &amp; commission</h2>
          <div className="mt-6 flex h-52 items-end gap-3">
            {revenueSeries.map((r) => (
              <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t-md bg-primary" style={{ height: `${(r.revenue / max) * 100}%` }} title={usd(r.revenue)} />
                  <div className="w-1/2 rounded-t-md bg-accent" style={{ height: `${(r.commission / max) * 100}%` }} title={usd(r.commission)} />
                </div>
                <span className="text-xs text-muted-foreground">{r.month}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Marketplace growth</h2>
          <div className="mt-6 flex h-52 items-end gap-3">
            {providerGrowth.map((g) => (
              <div key={g.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t-md bg-primary/70" style={{ height: `${(g.providers / maxUsers) * 100}%` }} title={`${g.providers} providers`} />
                  <div className="w-1/2 rounded-t-md bg-success/70" style={{ height: `${(g.customers / maxUsers) * 100}%` }} title={`${g.customers} customers`} />
                </div>
                <span className="text-xs text-muted-foreground">{g.month}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Providers awaiting approval</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/providers">Review</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {pendingProviders.length === 0 && <p className="text-sm text-muted-foreground">No pending applications.</p>}
            {pendingProviders.map((p) => (
              <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.category} · {p.city}, {p.state}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Recent transactions</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/payouts">View all</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.id} · {usd(t.amount)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.customer} → {t.provider} · {t.date}
                  </p>
                </div>
                <StatusPill status={t.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
