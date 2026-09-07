import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  CheckCircle,
  Clock,
  DollarSign,
  Shirt,
  Sparkles,
  Car,
  PackageX,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import axios from "@/api/axios";
import { getDashboardApi } from "@/api/booking.api";
import { PageHeader, StatCard, StatusPill } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";

const ProviderDashboard = () => {
  const location = useLocation();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.post("/booking/list", {});
        setOrders(res.data.bookings || []);
      } catch (err: any) {
        console.error("Error fetching orders", err.response?.data);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDashboardApi();
        setDashboardData(res.data.data);
      } catch (err: any) {
        console.error("Dashboard error", err?.response?.data);
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
          <p className="mt-4 text-sm text-muted-foreground">Loading provider dashboard...</p>
        </div>
      </div>
    );
  }

  const totalEarnings = dashboardData?.total_amount || 0;
  const totalOrders = dashboardData?.total_orders || 0;
  const activeOrders = dashboardData?.active_orders || 0;
  const completedOrders = dashboardData?.completed_orders || 0;

  return (
    <div className="container-page py-8">
      <PageHeader
        title="Provider Overview"
        subtitle="Track your incoming jobs, revenue metrics, and performance stats."
        action={
          <Button asChild>
            <Link to="/provider/orders">
              Manage Orders <ArrowRight size={16} className="ml-1" />
            </Link>
          </Button>
        }
      />

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Earnings"
          value={`$${totalEarnings.toFixed(2)}`}
          hint="Gross revenue"
          icon={DollarSign}
          tone="brand"
        />
        <StatCard
          label="Active Jobs"
          value={activeOrders}
          hint="Currently in progress"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Completed Jobs"
          value={completedOrders}
          hint="Total completed"
          icon={CheckCircle}
          tone="success"
        />
        <StatCard
          label="Total Bookings"
          value={totalOrders}
          hint="All time requests"
          icon={ShoppingBag}
          tone="accent"
        />
      </div>

      {/* Service Breakdown Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Laundry</span>
            <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Shirt size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{dashboardData?.laundry_orders || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Active & completed laundry jobs</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">House Cleaning</span>
            <span className="grid size-9 place-items-center rounded-xl bg-success-soft text-success">
              <Sparkles size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{dashboardData?.house_cleaning_orders || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Housekeeping & deep clean jobs</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Car Wash</span>
            <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-soft-foreground">
              <Car size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{dashboardData?.car_wash_orders || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">Auto wash & detail jobs</p>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent Customer Orders</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/provider/orders">
              View all <ArrowRight size={15} className="ml-1" />
            </Link>
          </Button>
        </div>

        {orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Service Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold">
                      ORD-{String(order.id).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {order.customer ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim() : "Customer"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{order.service_category || "Laundry"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {order.booking_date ? new Date(order.booking_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={order.status || "Pending"} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-display font-bold text-primary">
                      ${(order.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/provider/order/${order.id}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <PackageX size={32} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No recent orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;