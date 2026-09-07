import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  User,
  ClipboardList,
  DollarSign,
  Percent,
  Receipt,
  Banknote,
  Shirt,
  Sparkles,
  Car,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { getAdminDashboardApi } from "@/api/admin.api";

const AdminDashboard = () => {
  const [dashData, setDashData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getAdminDashboardApi();
      if (response.data?.success) {
        setDashData(response.data.data || {});
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
          <p className="mt-4 text-sm text-muted-foreground">Loading admin analytics...</p>
        </div>
      </div>
    );
  }

  const totalUsers = dashData.totalUsers ?? 0;
  const totalProviders = dashData.totalProviders ?? 0;
  const activeBookings = dashData.activeBookings ?? 0;
  const totalRevenue = dashData.totalRevenue ?? 0;

  return (
    <div className="container-page py-6">
      <PageHeader
        title="Platform Console"
        subtitle="Marketplace statistics, operational queues, and revenue metrics."
        action={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/providers">Review Providers</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/orders">Manage Orders</Link>
            </Button>
          </>
        }
      />

      {/* Top Level Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          hint="Gross platform revenue"
          icon={Receipt}
          tone="brand"
        />
        <StatCard
          label="Active Bookings"
          value={activeBookings}
          hint="Currently active jobs"
          icon={ClipboardList}
          tone="warning"
        />
        <StatCard
          label="Total Customers"
          value={totalUsers}
          hint="Registered customer accounts"
          icon={Users}
          tone="accent"
        />
        <StatCard
          label="Verified Providers"
          value={totalProviders}
          hint="Approved service providers"
          icon={User}
          tone="success"
        />
      </div>

      {/* Order Category Breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Laundry Orders</span>
            <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Shirt size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{dashData.laundry_orders ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">House Cleaning</span>
            <span className="grid size-9 place-items-center rounded-xl bg-success-soft text-success">
              <Sparkles size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{dashData.house_cleaning_orders ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Car Wash Orders</span>
            <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-soft-foreground">
              <Car size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{dashData.car_wash_orders ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
