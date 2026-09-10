import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  Search,
  Phone,
  Package,
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle,
  Inbox,
  Users,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatCard, StatusPill, Avatar, Stars } from "@/components/shared/primitives";
import { getOrderList, getOrderDetails } from "@/services/order";
import { getDashboardApi } from "@/services/booking";
import {
  getCustomerDashboardApi,
  searchProvidersNearLocationApi,
  CustomerRecentBooking,
  CustomerAppointment,
  CustomerMessage,
  RecommendedProvider,
} from "@/services/dashboard/dashboard.service";
import chatApi from "@/services/chat/chat.service";
import { useAuthSession } from "@/hooks/useAuth";
import { normalizeBooking } from "@/utils/bookingAdapter";

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h2 className="truncate font-display text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const CustomerDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthSession();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // API Dashboard States
  const [activeCount, setActiveCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [pendingProposalsCount, setPendingProposalsCount] = useState<number>(0);
  const [upcomingApptsCount, setUpcomingApptsCount] = useState<number>(0);

  const [recentBookings, setRecentBookings] = useState<CustomerRecentBooking[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<CustomerAppointment[]>([]);
  const [messagesList, setMessagesList] = useState<CustomerMessage[]>([]);
  const [recommendedList, setRecommendedList] = useState<RecommendedProvider[]>([]);

  const trackingSteps = [
    { label: "Order Received", icon: Package, status: "pending" },
    { label: "Accepted", icon: PackageCheck, status: "accepted" },
    { label: "Rejected", icon: PackageCheck, status: "rejected" },
    { label: "In Process", icon: PackageCheck, status: "in_progress" },
    { label: "Finished", icon: CheckCircle, status: "finished" },
    { label: "Delivering", icon: Truck, status: "delivering" },
    { label: "Delivered", icon: MapPin, status: "delivered" },
  ];

  useEffect(() => {
    // Ensure profile user data is fetched
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    } else {
      fetchDashboardData();
    }
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      let reqData = { page: 1, limit: 10, status: "" };
      const [orderRes, fullDashRes, chatRes, nearbyRes]: any = await Promise.all([
        getOrderList(reqData).catch(() => ({ data: { success: false } })),
        getCustomerDashboardApi().catch(() => getDashboardApi()),
        chatApi.listUserChats().catch(() => null),
        searchProvidersNearLocationApi(10).catch(() => null),
      ]);

      if (orderRes.data?.success && orderRes.data?.bookings) {
        setOrders(orderRes.data.bookings || []);
      }

      // Process chat list API for messages
      if (chatRes?.data && Array.isArray(chatRes.data)) {
        const mappedChats: CustomerMessage[] = chatRes.data.map((c: any) => ({
          chat_id: c.id,
          last_message: c.last_message?.content || c.last_message || "Chat conversation",
          last_message_time: c.last_message_at || c.updated_at || "",
          provider: {
            id: c.provider?.id || c.provider_id || 0,
            business_name: c.provider?.business_name || c.provider?.name || `${c.provider?.first_name || ''} ${c.provider?.last_name || ''}`.trim() || "Provider",
            avatar: c.provider?.profile_photo || c.provider?.avatar,
          },
        }));
        setMessagesList(mappedChats);
      }

      // Process 10-mile radius search API for recommended providers
      if (nearbyRes?.data) {
        const rawProviders = Array.isArray(nearbyRes.data)
          ? nearbyRes.data
          : nearbyRes.data.providers || nearbyRes.data.rows || [];
        if (rawProviders.length > 0) {
          const mappedRecs: RecommendedProvider[] = rawProviders.map((p: any) => ({
            id: p.id,
            business_name: p.business_name || p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || "Professional",
            rating: p.rating || p.avg_rating || 5.0,
            location: p.city || p.location || p.state || "Within 10 miles",
            avatar: p.profile_photo || p.avatar,
          }));
          setRecommendedList(mappedRecs);
        }
      }

      if (fullDashRes.data?.success) {
        const dData = fullDashRes.data.data;
        if (dData.stats) {
          setActiveCount(dData.stats.active_orders ?? 0);
          setCompletedCount(dData.stats.completed_orders ?? 0);
        } else if (typeof dData.active_orders === "number") {
          setActiveCount(dData.active_orders);
          setCompletedCount(dData.completed_orders || 0);
        }

        if (dData.recentBookings && dData.recentBookings.length > 0) {
          setRecentBookings(dData.recentBookings);
        }
        if (dData.appointments) {
          setAppointmentsList(dData.appointments);
          setUpcomingApptsCount(dData.appointments.length);
        }
        if (dData.messages && messagesList.length === 0) {
          setMessagesList(dData.messages);
        }
        if (dData.recommendedProviders && recommendedList.length === 0) {
          setRecommendedList(dData.recommendedProviders);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const response: any = await getOrderDetails(id);
      if (response.success) {
        setSelectedOrder(response.data);
        const st = (response.data.appointment_status || response.data.status || "").toLowerCase();
        const stepIndex = trackingSteps.findIndex((s) => s.status.toLowerCase() === st);
        setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Dynamic user greeting
  const userName =
    user?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : null) ||
    user?.email?.split("@")[0] ||
    "";

  const greetingTitle = userName ? `Welcome back, ${userName}` : "Welcome back";
  const userSubtitle = user?.city
    ? `Here's what's happening across your projects in ${user.city}.`
    : "Here's what's happening across your projects.";

  // Single Order Tracking View (when :id is present)
  if (id && selectedOrder) {
    const normalizedOrder = normalizeBooking(selectedOrder);
    return (
      <>
        <PageHeader
          title={`Order Tracking — ${normalizedOrder.displayId}`}
          subtitle={`Placed on ${normalizedOrder.formattedDate}`}
          action={
            <Button variant="outline" onClick={() => navigate("/customer/dashboard")}>
              Back to Dashboard
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl border-border shadow-card">
              <CardContent className="p-6">
                <h3 className="font-display text-base font-bold">Order Progress</h3>
                <Progress value={((currentStep + 1) / trackingSteps.length) * 100} className="my-6 h-2" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                  {trackingSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStep;
                    return (
                      <div key={step.label} className="flex flex-col items-center text-center">
                        <div
                          className={`flex size-10 items-center justify-center rounded-full transition-all ${isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                        >
                          <Icon size={18} />
                        </div>
                        <p className="mt-2 text-xs font-semibold">{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border-border shadow-card">
              <CardContent className="p-6">
                <h3 className="font-display text-base font-bold">Provider Information</h3>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar initials={normalizedOrder.providerName?.slice(0, 2).toUpperCase() || "PR"} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{normalizedOrder.providerName}</p>
                    <p className="text-xs text-muted-foreground">{normalizedOrder.categoryName}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    <Phone size={14} className="mr-2" /> Contact Provider
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Exact Customer Dashboard UI
  return (
    <>
      <PageHeader
        title={greetingTitle}
        subtitle={userSubtitle}
        action={
          <>
            <Button asChild>
              <Link to="/search">
                <Search size={16} className="mr-1.5" /> Find a Professional
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/messages">
                <MessageSquare size={16} className="mr-1.5" /> Messages
              </Link>
            </Button>
          </>
        }
      />

      {/* 4 STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active bookings"
          value={activeCount || orders.length}
          hint="Scheduled or in progress"
          icon={Briefcase}
        />
        <StatCard
          label="Pending proposals"
          value={pendingProposalsCount}
          hint="Waiting on your decision"
          icon={FileText}
          tone="warning"
        />
        <StatCard
          label="Upcoming appointments"
          value={upcomingApptsCount || appointmentsList.length}
          hint="Scheduled upcoming"
          icon={CalendarCheck}
          tone="accent"
        />
        <StatCard
          label="Completed services"
          value={completedCount}
          hint="Lifetime"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Panel: Recent bookings */}
          <Panel
            title="Recent bookings"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/orders">
                  View all <ArrowRight size={15} className="ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="divide-y divide-border">
              {recentBookings.length > 0 ? (
                recentBookings.slice(0, 4).map((b) => (
                  <Link
                    key={b.id}
                    to={`/customer/bookings/${b.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.service_category || b.booking_number}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {b.booking_number || `JOB-${b.id}`} · {b.service_category || "Service"} · {b.booking_date || "Recent"}
                      </p>
                    </div>
                    <StatusPill status={b.appointment_status || b.status || "Scheduled"} />
                  </Link>
                ))
              ) : orders.length > 0 ? (
                orders.slice(0, 4).map((order) => {
                  const n = normalizeBooking(order);
                  return (
                    <Link
                      key={order.id}
                      to={`/customer/bookings/${order.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{n.categoryName || "Service Booking"}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {n.displayId} · {n.categoryName} · {n.formattedDate}
                        </p>
                      </div>
                      <StatusPill status={n.status} />
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No recent bookings found.</p>
                  <Button asChild className="mt-3" size="sm" variant="outline">
                    <Link to="/search">Book a Service</Link>
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          {/* Panel: Upcoming appointments */}
          <Panel
            title="Upcoming appointments"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/appointments">
                  Schedule <ArrowRight size={15} className="ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {appointmentsList.length > 0 ? (
                appointmentsList.slice(0, 4).map((a) => {
                  const dateRaw = a.booking_date || "Upcoming";
                  const parts = dateRaw.split(" ");
                  const month = parts[0] || "NEXT";
                  const day = (parts[1] || "").replace(",", "");
                  return (
                    <div
                      key={a.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-center leading-none">
                        <span className="block text-[10px] font-semibold uppercase text-primary">
                          {month}
                        </span>
                        <span className="block font-display text-base font-bold text-primary">
                          {day || "•"}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.service_category || "Service Appointment"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.provider?.business_name || "Provider"} · {a.time_slot || "Time TBD"}
                        </p>
                      </div>
                      <StatusPill status={a.appointment_status || a.status || "Confirmed"} />
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <CalendarX size={28} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No upcoming appointments scheduled.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Panel: Recent messages */}
          <Panel
            title="Recent messages"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/messages">Open</Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {messagesList.length > 0 ? (
                messagesList.slice(0, 4).map((m) => {
                  const name = m.provider?.business_name || "Provider";
                  const initials = name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
                  return (
                    <Link
                      key={m.chat_id}
                      to="/messages"
                      className="flex min-w-0 items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50"
                    >
                      <Avatar initials={initials || "PR"} size="sm" src={m.provider?.avatar} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{name}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {m.last_message_time ? new Date(m.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{m.last_message}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Inbox size={28} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No recent messages.</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Panel: Recommended professionals */}
          <Panel title="Recommended professionals">
            <div className="space-y-3">
              {recommendedList.length > 0 ? (
                recommendedList.slice(0, 4).map((p) => {
                  const name = p.business_name || "Professional";
                  const initials = name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();
                  return (
                    <div key={p.id} className="flex min-w-0 items-center gap-3">
                      <Avatar initials={initials || "PR"} size="sm" src={p.avatar} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Stars rating={p.rating || 5} size={11} /> {p.rating || 5.0} · {p.location || "Within 10 miles"}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/provider/${p.id}`}>View</Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Users size={28} className="mx-auto text-muted-foreground/60" />
                  <p className="mt-2 text-sm text-muted-foreground">No recommended professionals nearby.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;
