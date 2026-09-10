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
  Inbox,
  CalendarX,
  PackageX,
} from "lucide-react";
import axios from "@/services/axios";
import { getDashboardApi } from "@/services/booking";
import {
  getProviderDashboardApi,
  ProviderJob,
  ProviderAppointment,
  ProviderEarnings,
  ProviderDashboardStats,
} from "@/services/dashboard/dashboard.service";
import chatApi from "@/services/chat/chat.service";
import { useAuthSession } from "@/hooks/useAuth";
import { PageHeader, StatCard, StatusPill, Avatar } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { Panel } from "@/pages/customer/CustomerDashboard";

const ProviderDashboard = () => {
  const { user, fetchMe } = useAuthSession();

  const [jobsList, setJobsList] = useState<ProviderJob[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<ProviderAppointment[]>([]);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null);
  const [stats, setStats] = useState<ProviderDashboardStats | null>(null);

  const [legacyOrders, setLegacyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure profile user data is loaded
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let res: any;
        const [dashRes, chatRes] = await Promise.all([
          getProviderDashboardApi().catch(() => getDashboardApi()),
          chatApi.listUserChats().catch(() => null),
        ]);
        res = dashRes;

        if (res?.data?.success) {
          const dData = res.data.data;
          if (dData.stats) setStats(dData.stats);
          else if (typeof dData.total_orders === "number") setStats(dData);

          if (dData.jobs) setJobsList(dData.jobs);
          if (dData.appointments) setAppointmentsList(dData.appointments);
          if (dData.earnings) setEarnings(dData.earnings);
        }

        if (chatRes?.data && Array.isArray(chatRes.data)) {
          setMessagesList(chatRes.data);
        }

        // Also fetch legacy order list as fallback
        const orderRes = await axios.post("/booking/list", {}).catch(() => null);
        if (orderRes?.data?.bookings) {
          setLegacyOrders(orderRes.data.bookings);
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

  // Dynamic business name from logged-in provider profile
  const businessName =
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

  // Calculated metrics
  const fixedRequestsCount = stats
    ? stats.laundry_orders + stats.house_cleaning_orders + stats.car_wash_orders
    : 0;

  const quoteRequestsCount = stats ? stats.pending_orders : 0;
  const activeJobsCount = stats ? stats.active_orders : jobsList.length || 0;
  const ratingValue = stats && typeof stats.avg_rating === "number" ? stats.avg_rating.toFixed(1) : "0.0";
  const reviewCountHint = stats && typeof stats.review_count === "number" ? `${stats.review_count} reviews` : "0 reviews";

  return (
    <div className="container-page py-8">
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
              {jobsList.length > 0
                ? jobsList.slice(0, 5).map((j) => {
                    const isFixed = j.service_category?.toLowerCase().includes("laundry") ||
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
                            Customer: {j.customer?.full_name || "Customer"} · {j.booking_date || "Today"} · ${(j.total_amount || 0).toFixed(2)}
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
                : legacyOrders.length > 0 ? (
                    legacyOrders.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                              Fixed Service
                            </span>
                            <span className="text-xs font-semibold text-foreground truncate">
                              {b.service_category || `ORD-${b.id}`}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            Customer: {b.customer ? `${b.customer.first_name || ""} ${b.customer.last_name || ""}`.trim() : "Customer"} · ${b.total_amount ? Number(b.total_amount).toFixed(2) : "0.00"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusPill status={b.status || "Confirmed"} />
                          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                            <Link to={`/provider/order/${b.id}`}>Review</Link>
                          </Button>
                        </div>
                      </div>
                    ))
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

          {/* Panel: Recent Messages */}
          <Panel
            title="Recent Messages"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/messages">Open Inbox</Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {messagesList.length > 0 ? (
                messagesList.slice(0, 4).map((c: any) => {
                  const custName = c.customer?.name || c.customer?.first_name || c.user?.name || `${c.user?.first_name || ''} ${c.user?.last_name || ''}`.trim() || "Customer";
                  const initials = custName.slice(0, 2).toUpperCase();
                  const lastText = c.last_message?.content || c.last_message || "Message thread";
                  const time = c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently";
                  return (
                    <Link
                      key={c.id}
                      to="/messages"
                      className="flex min-w-0 items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
                    >
                      <Avatar initials={initials || "CU"} size="sm" src={c.customer?.avatar} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{custName}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{lastText}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Inbox size={28} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent customer messages.</p>
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
    </div>
  );
};

export default ProviderDashboard;