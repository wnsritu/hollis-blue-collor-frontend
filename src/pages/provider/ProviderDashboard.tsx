import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  CalendarCheck,
  CreditCard,
  FileText,
  HelpCircle,
  Star,
  Tag,
  UserCog,
  ArrowRight,
  CalendarX,
  PackageX,
} from "lucide-react";
import {
  getProviderDashboardApi,
  ProviderJob,
  ProviderAppointment,
  ProviderEarnings,
  ProviderDashboardStats,
} from "@/services/dashboard/dashboard.service";
import { useAuthSession } from "@/hooks/useAuth";
import { PageHeader, StatCard, StatusPill, Avatar } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { Panel } from "@/pages/customer/CustomerDashboard";

const ProviderDashboard = () => {
  const { user } = useAuthSession();

  const [jobsList, setJobsList] = useState<ProviderJob[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<ProviderAppointment[]>([]);
  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null);
  const [stats, setStats] = useState<ProviderDashboardStats | null>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res: any = await getProviderDashboardApi();
        // http.get returns response.data directly: { success: true, data: { stats, jobs, appointments, earnings, reviews } }
        const dData = res?.data || res;

        if (dData) {
          const sData = dData.stats || dData;
          if (sData) setStats(sData);

          if (Array.isArray(dData.jobs)) setJobsList(dData.jobs);
          if (Array.isArray(dData.appointments)) setAppointmentsList(dData.appointments);
          if (dData.earnings) setEarnings(dData.earnings);
          if (Array.isArray(dData.reviews)) setReviewsList(dData.reviews);
        }
      } catch (err: any) {
        console.error("Dashboard loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading provider portal...</p>
        </div>
      </div>
    );
  }

  // Dynamic business name from provider profile or stats
  const businessName =
    stats?.business_name ||
    user?.provider?.business_name ||
    user?.business_name ||
    user?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : null) ||
    user?.email?.split("@")[0] ||
    "Provider Overview";

  const providerCity =
    user?.provider?.city || user?.city || user?.provider?.location || user?.address || "";
  const providerState = user?.provider?.state || user?.state || "";
  const locationSubtitle = providerCity
    ? `${providerCity}${providerState ? `, ${providerState}` : ""} · Professional Plan`
    : "Professional Plan · Verified";

  // Correct service type counts from API (based on project_id)
  const fixedRequestsCount = stats?.direct_service_orders ?? stats?.fixed_orders ?? 0;
  const quoteRequestsCount = stats?.request_quote_orders ?? stats?.quote_orders ?? 0;
  const activeJobsCount = stats?.active_orders ?? jobsList.length;

  const ratingNum = stats?.avg_rating != null ? Number(stats.avg_rating) : null;
  const ratingValue =
    ratingNum != null && !isNaN(ratingNum)
      ? ratingNum.toFixed(1)
      : reviewsList.length > 0
      ? (reviewsList.reduce((acc, curr) => acc + Number(curr.rating || 5), 0) / reviewsList.length).toFixed(1)
      : "0.0";

  const reviewCount = stats?.review_count != null ? Number(stats.review_count) : reviewsList.length;
  const reviewCountHint = `${reviewCount} reviews`;

  return (
    <>
      <PageHeader
        title={`Welcome, ${businessName}`}
        subtitle={locationSubtitle}
        action={
          <Button asChild variant="outline">
            <Link to="/provider/profile">
              <UserCog size={16} className="mr-1.5" /> Update Business Profile
            </Link>
          </Button>
        }
      />

      {/* 4 STAT CARDS SPLIT BY REQUEST TYPE */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fixed Service Requests"
          value={fixedRequestsCount}
          hint="Direct fixed bookings"
          icon={Tag}
          tone="accent"
        />
        <StatCard
          label="Request a Quote"
          value={quoteRequestsCount}
          hint="Custom requirement quotes"
          icon={FileText}
        />
        <StatCard
          label="Active Jobs"
          value={activeJobsCount}
          hint="Confirmed or in progress"
          icon={Briefcase}
        />
        <StatCard
          label="Rating"
          value={ratingValue}
          hint={reviewCountHint}
          icon={Star}
          tone="warning"
        />
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Panel: Service Requests & Active Jobs */}
          <Panel
            title="Service Requests & Active Jobs"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/provider/orders">
                  View All Jobs <ArrowRight size={15} className="ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {jobsList.length > 0 ? (
                jobsList.slice(0, 5).map((j) => {
                  const isFixed =
                    j.service_category?.toLowerCase().includes("laundry") ||
                    j.service_category?.toLowerCase().includes("cleaning") ||
                    j.service_category?.toLowerCase().includes("wash");
                  return (
                    <div
                      key={j.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isFixed
                                ? "bg-primary-soft text-primary"
                                : "bg-accent-soft text-accent-soft-foreground font-bold"
                            }`}
                          >
                            {isFixed ? "Fixed Service" : "Request a Quote"}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {j.service_category || j.booking_number}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Customer: {j.customer?.full_name || "Customer"} · {j.booking_date || "Today"} · ${Number(j.total_amount || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusPill status={j.appointment_status || j.status || "Confirmed"} />
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <Link to={`/provider/order/${j.id}`}>Review</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <PackageX size={28} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No active service requests right now.</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Panel: Monthly Earnings Trend */}
          <Panel
            title="Monthly Earnings Trend"
            action={
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
                {earnings ? `$${earnings.net_earnings.toFixed(2)} net` : "$0.00 net"}
              </span>
            }
          >
            <div className="grid h-36 grid-cols-6 items-end gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
              {[
                { month: "Jan", amount: `$${((earnings?.net_earnings || 0) * 0.1).toFixed(0)}`, height: `${Math.max(15, (earnings?.net_earnings ? 30 : 15))}%` },
                { month: "Feb", amount: `$${((earnings?.net_earnings || 0) * 0.15).toFixed(0)}`, height: `${Math.max(15, (earnings?.net_earnings ? 45 : 15))}%` },
                { month: "Mar", amount: `$${((earnings?.net_earnings || 0) * 0.12).toFixed(0)}`, height: `${Math.max(15, (earnings?.net_earnings ? 38 : 15))}%` },
                { month: "Apr", amount: `$${((earnings?.net_earnings || 0) * 0.22).toFixed(0)}`, height: `${Math.max(15, (earnings?.net_earnings ? 65 : 15))}%` },
                { month: "May", amount: `$${((earnings?.net_earnings || 0) * 0.18).toFixed(0)}`, height: `${Math.max(15, (earnings?.net_earnings ? 55 : 15))}%` },
                { month: "Jun", amount: earnings ? `$${earnings.gross_revenue.toFixed(0)}` : "$0", height: `${Math.max(15, (earnings?.gross_revenue ? 90 : 15))}%` },
              ].map((item) => (
                <div key={item.month} className="group flex h-full flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground opacity-70 group-hover:opacity-100">
                    {item.amount}
                  </span>
                  <div
                    className="w-full max-w-[32px] rounded-t-lg bg-primary/85 transition-all group-hover:bg-primary"
                    style={{ height: item.height }}
                  />
                  <span className="text-xs font-semibold text-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Panel: Upcoming Appointments */}
          <Panel title="Upcoming Appointments">
            <div className="space-y-3">
              {appointmentsList.length > 0 ? (
                appointmentsList.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.project_title || a.service_category}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.booking_date} · {a.time_slot || "Time TBD"} · {a.customer?.full_name || "Customer"}
                      </p>
                    </div>
                    <StatusPill status={a.appointment_status || a.status || "Confirmed"} />
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <CalendarX size={28} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No upcoming appointments.</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Panel: Recent Customer Reviews */}
          <Panel
            title="Recent Customer Reviews"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/provider/profile">
                  View All <ArrowRight size={15} className="ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {reviewsList.length > 0 ? (
                reviewsList.slice(0, 4).map((r) => {
                  const custName = r.customer?.full_name || "Customer";
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border p-3 space-y-1.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar initials={custName.charAt(0) || "C"} size="sm" src={r.customer?.avatar} />
                          <span className="text-sm font-semibold truncate">{custName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs shrink-0">
                          <Star size={13} className="fill-amber-500 text-amber-500" />
                          <span>{r.rating || 5.0}</span>
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <Star size={24} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent customer reviews yet.</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Panel: Quick Actions */}
          <Panel title="Quick Actions">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { to: "/provider/profile", label: "Add FAQ", icon: HelpCircle },
                { to: "/provider/services", label: "Services & Pricing", icon: UserCog },
                { to: "/provider/availability", label: "Availability", icon: CalendarCheck },
                { to: "/provider/subscription", label: "Subscription", icon: CreditCard },
                { to: "/provider/profile", label: "Business Profile", icon: UserCog },
              ].map((a) => (
                <Button key={a.label} asChild variant="outline" className="justify-start text-xs">
                  <Link to={a.to}>
                    <a.icon size={15} className="mr-1.5" /> {a.label}
                  </Link>
                </Button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default ProviderDashboard;