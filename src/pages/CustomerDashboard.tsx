import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  Search,
  ArrowRight,
  Phone,
  Clock,
  Package,
  PackageCheck,
  Truck,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatCard, StatusPill, Avatar } from "@/components/shared/primitives";
import { getOrderList, getOrderDetails, updateOrderStatus } from "@/services/order.service";
import { getDashboardApi } from "@/api/booking.api";
import { saveOrderBookingState } from "@/utils/bookingState";

const CustomerDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    laundryOrders: 0,
    houseCleaningOrders: 0,
    carWashOrders: 0,
  });
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    if (id) {
      fetchOrderDetails();
    } else {
      fetchOrderList();
    }
  }, [id]);

  const fetchOrderList = async () => {
    try {
      let reqData = { page: 1, limit: 10, status: "" };
      const [orderRes, statsRes]: any = await Promise.all([
        getOrderList(reqData),
        getDashboardApi(),
      ]);

      if (orderRes.data?.success) {
        setOrders(orderRes.data.bookings || []);
      }

      if (statsRes.data?.success) {
        const dData = statsRes.data.data;
        setStats({
          activeOrders: dData.active_orders || 0,
          completedOrders: dData.completed_orders || 0,
          totalSpent: dData.total_amount || 0,
          laundryOrders: dData.laundry_orders || 0,
          houseCleaningOrders: dData.house_cleaning_orders || 0,
          carWashOrders: dData.car_wash_orders || 0,
        });
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
        const stepIndex = trackingSteps.findIndex((s) => s.status === response.data.status);
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

  // Single Order Detail Tracking View
  if (id && selectedOrder) {
    return (
      <div className="container-page py-8">
        <PageHeader
          title={`Order Tracking — ${selectedOrder.order_id || `ORD-${selectedOrder.id}`}`}
          subtitle={`Placed on ${selectedOrder.booking_date ? new Date(selectedOrder.booking_date).toLocaleDateString() : 'N/A'}`}
          action={
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
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
                          className={`flex size-10 items-center justify-center rounded-full transition-all ${
                            isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
                  <Avatar initials={selectedOrder.provider?.business_name?.slice(0, 2).toUpperCase() || "PR"} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{selectedOrder.provider?.business_name || "Service Provider"}</p>
                    <p className="text-xs text-muted-foreground">{selectedOrder.service_category || "Cleaning"}</p>
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
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <PageHeader
        title="Welcome back!"
        subtitle="Here's what's happening across your active orders and bookings."
        action={
          <>
            <Button asChild>
              <Link to="/search">
                <Search size={16} className="mr-2" /> Find a Professional
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/messages">
                <MessageSquare size={16} className="mr-2" /> Messages
              </Link>
            </Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active orders" value={stats.activeOrders} hint="Scheduled or in progress" icon={Briefcase} />
        <StatCard label="Completed orders" value={stats.completedOrders} hint="Lifetime completed" icon={CheckCircle2} tone="success" />
        <StatCard label="Total spent" value={`$${stats.totalSpent.toFixed(2)}`} hint="Across all bookings" icon={FileText} tone="warning" />
        <StatCard label="Laundry orders" value={stats.laundryOrders} hint="Wash & Fold services" icon={CalendarCheck} tone="accent" />
      </div>

      {/* Recent Orders List */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent Orders</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/orders">
              View all <ArrowRight size={15} className="ml-1" />
            </Link>
          </Button>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold">
                      {order.order_id || `ORD-${order.id}`}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {order.provider?.business_name || order.provider_name || "Provider"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{order.service_category || "Laundry"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {order.booking_date ? new Date(order.booking_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={order.status || "Pending"} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-display font-bold text-primary">
                      ${(parseFloat(order.total_amount) || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/order/${order.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No orders found yet.</p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/search">Book a Service</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
