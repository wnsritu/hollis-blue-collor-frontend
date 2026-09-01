import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Users, User, ClipboardList, DollarSign, Shirt, Sparkles, Car, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardApi } from "@/api/admin.api";
import { DashboardCard, ProgressCategoryChart, VerticalBarChart } from "@/components/DashboardWidgets";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const isDashboardAvailable = true; // Set to false to show Coming Soon view
  const [dashData, setDashData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch admin dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getAdminDashboardApi();
      if (response.data.success) {
        setDashData(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Show Coming Soon if dashboard disabled
  if (!isDashboardAvailable) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <LayoutDashboard size={24} />
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Admin Feature
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Admin Dashboard Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            View analytics, track performance, and monitor platform activity from one place. This feature will be available soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-grid p-3 space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("dashboard")}
      </h1>

      {/* Primary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Total Customers"
          value={dashData.totalUsers ?? 0}
          icon={Users}
          iconColorClass="text-primary bg-primary/10"
        />
        <DashboardCard
          label="Total Providers"
          value={dashData.totalProviders ?? 0}
          icon={User}
          iconColorClass="text-emerald-600 bg-emerald-50"
        />
        <DashboardCard
          label="Active Bookings"
          value={dashData.activeBookings ?? 0}
          icon={ClipboardList}
          iconColorClass="text-yellow-600 bg-yellow-50"
        />
        <DashboardCard
          label="Platform Revenue"
          value={`$${(dashData.totalRevenue ?? 0).toFixed(2)}`}
          icon={DollarSign}
          iconColorClass="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Service breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardCard
          label="Laundry Orders"
          value={dashData.laundry_orders ?? 0}
          icon={Shirt}
          iconColorClass="text-primary bg-primary/10"
        />
        <DashboardCard
          label="House Cleaning Orders"
          value={dashData.house_cleaning_orders ?? 0}
          icon={Sparkles}
          iconColorClass="text-emerald-600 bg-emerald-50"
        />
        <DashboardCard
          label="Car Wash Orders"
          value={dashData.car_wash_orders ?? 0}
          icon={Car}
          iconColorClass="text-blue-600 bg-blue-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressCategoryChart
              data={dashData.revenue_by_service || [
                { label: "Laundry", value: 0, colorClass: "bg-primary" },
                { label: "House Cleaning", value: 0, colorClass: "bg-emerald-500" },
                { label: "Car Wash", value: 0, colorClass: "bg-blue-500" }
              ]}
              valueFormatter={(val) => `$${val.toFixed(2)}`}
            />
          </CardContent>
        </Card>

        {/* Orders Per Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <VerticalBarChart
              data={(dashData.orders_per_day || []).map((item: any) => ({
                label: item.day,
                value: item.orders
              }))}
              valueFormatter={(val) => String(val)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
