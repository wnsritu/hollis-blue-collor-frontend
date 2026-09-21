import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Briefcase,
  Percent,
  Receipt,
  Users,
} from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { getAdminDashboardApi } from "@/services/admin";
import type { AdminDashboardData } from "@/types";

const usd = (n?: number | null) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

const AdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData>({});
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getAdminDashboardApi();
      if (response.data?.success) {
        setData(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading admin overview...</p>
        </div>
      </div>
    );
  }

  const gmv = data.gmv ?? data.stats?.totalRevenue ?? 0;
  const commissionRate = data.commissionRate ?? 10;
  const commission = data.commission ?? Math.round((gmv * commissionRate) / 100);
  const activeJobs = data.activeJobs ?? data.stats?.activeBookings ?? 0;
  const providersCount = data.providersCount ?? data.stats?.totalProviders ?? 0;
  const customersCount = data.customersCount ?? data.stats?.totalUsers ?? 0;
  const pendingPayouts = data.pendingPayouts ?? { totalAmount: 0, count: 0 };
  const revenueSeries = data.revenueSeries ?? [];
  const providerGrowth = data.providerGrowth ?? [];
  const pendingProviders = data.pendingProviders ?? [];
  const recentTransactions = data.recentTransactions ?? [];

  const maxRevenue = Math.max(...(revenueSeries.map((r) => r.revenue) || []), 1);
  const maxUsers = Math.max(
    ...(providerGrowth.flatMap((g) => [g.providers, g.customers]) || []),
    1
  );

  const currentMonthYear = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        subtitle={`${currentMonthYear} platform activity & summary`}
        action={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/commission">
                <Percent size={16} className="mr-1.5" /> Commission
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/payouts">
                <Banknote size={16} className="mr-1.5" /> Release payouts
              </Link>
            </Button>
          </>
        }
      />

      {/* 5 Top Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Gross marketplace volume"
          value={usd(gmv)}
          hint="Paid transactions"
          icon={Receipt}
        />
        <StatCard
          label="Commission revenue"
          value={usd(commission)}
          hint={`${commissionRate}% take rate`}
          icon={Percent}
          tone="accent"
        />
        <StatCard
          label="Active jobs"
          value={activeJobs}
          hint="All statuses"
          icon={Briefcase}
        />
        <StatCard
          label="Providers / customers"
          value={`${providersCount} / ${customersCount}`}
          hint="Registered accounts"
          icon={Users}
        />
        <StatCard
          label="Pending payouts"
          value={usd(pendingPayouts.totalAmount)}
          hint={`${pendingPayouts.count ?? 0} awaiting release`}
          icon={Banknote}
          tone="warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue & Commission Bar Chart */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Revenue &amp; commission</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-primary inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-accent inline-block" />
                Commission
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3">
            {revenueSeries.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No revenue history available.
              </div>
            ) : (
              revenueSeries.map((r) => {
                const revPct = maxRevenue > 0 ? (r.revenue / maxRevenue) * 100 : 0;
                const commPct = maxRevenue > 0 ? (r.commission / maxRevenue) * 100 : 0;

                return (
                  <div key={r.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="relative flex h-44 w-full items-end justify-center gap-1.5 px-1">
                      <div
                        className="w-1/2 min-w-[10px] max-w-[28px] rounded-t-md bg-primary transition-all duration-300 hover:opacity-85"
                        style={{
                          height: r.revenue > 0 ? `${Math.max(revPct, 6)}%` : "4px",
                          opacity: r.revenue > 0 ? 1 : 0.25,
                        }}
                        title={`Revenue: ${usd(r.revenue)}`}
                      />
                      <div
                        className="w-1/2 min-w-[10px] max-w-[28px] rounded-t-md bg-accent transition-all duration-300 hover:opacity-85"
                        style={{
                          height: r.commission > 0 ? `${Math.max(commPct, 6)}%` : "4px",
                          opacity: r.commission > 0 ? 1 : 0.25,
                        }}
                        title={`Commission: ${usd(r.commission)}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{r.month}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Marketplace Growth Bar Chart */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Marketplace growth</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-primary/80 inline-block" />
                Providers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-xs bg-emerald-600 inline-block" />
                Customers
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3">
            {providerGrowth.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No growth statistics available.
              </div>
            ) : (
              providerGrowth.map((g) => {
                const provPct = maxUsers > 0 ? (g.providers / maxUsers) * 100 : 0;
                const custPct = maxUsers > 0 ? (g.customers / maxUsers) * 100 : 0;

                return (
                  <div key={g.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="relative flex h-44 w-full items-end justify-center gap-1.5 px-1">
                      <div
                        className="w-1/2 min-w-[10px] max-w-[28px] rounded-t-md bg-primary/80 transition-all duration-300 hover:opacity-85"
                        style={{
                          height: g.providers > 0 ? `${Math.max(provPct, 6)}%` : "4px",
                          opacity: g.providers > 0 ? 1 : 0.25,
                        }}
                        title={`${g.providers} providers`}
                      />
                      <div
                        className="w-1/2 min-w-[10px] max-w-[28px] rounded-t-md bg-emerald-600 transition-all duration-300 hover:opacity-85"
                        style={{
                          height: g.customers > 0 ? `${Math.max(custPct, 6)}%` : "4px",
                          opacity: g.customers > 0 ? 1 : 0.25,
                        }}
                        title={`${g.customers} customers`}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{g.month}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Operational Queues Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Providers Awaiting Approval */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Providers awaiting approval</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/providers">Review</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {pendingProviders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No pending applications.
              </p>
            ) : (
              pendingProviders.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.category} · {p.city}, {p.state}
                    </p>
                  </div>
                  <StatusPill status={p.status || "Pending"} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Recent transactions</h2>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/transactions">View all</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent transactions.
              </p>
            ) : (
              recentTransactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {t.id} · {usd(t.amount)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.customer} → {t.provider} · {t.date}
                    </p>
                  </div>
                  <StatusPill status={t.status || "Paid"} />
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
