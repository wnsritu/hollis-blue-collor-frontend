import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  ShoppingBag,
  CheckCircle,
  Clock,
  DollarSign,
  LayoutDashboard,
  PackageX,
  Shirt,
  Sparkles,
  Car
} from "lucide-react";
import axios from "@/api/axios";
import { getDashboardApi } from "@/api/booking.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, ProgressCategoryChart, VerticalBarChart } from "@/components/DashboardWidgets";

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.post("/booking/list", {});
        // console.log("orders:", res.data);

        setOrders(res.data.bookings || []);
      } catch (err) {
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

  // Status color mapping
  const statusColorMap: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    price_updated: "bg-purple-100 text-purple-700",
    accepted: "bg-blue-100 text-blue-700",
    in_process: "bg-blue-100 text-blue-700",
    // cancelled: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    finished: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
  };

  // Capitalize function
  const capitalizeStatus = (status: string) =>
    status
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");


  const serviceCategories = dashboardData?.service_categories || ["Laundry", "House Cleaning", "Car Wash"];
  const showLaundry = serviceCategories.includes("Laundry");
  const showCleaning = serviceCategories.includes("House Cleaning");
  const showCarWash = serviceCategories.includes("Car Wash");

  // Determine grid columns dynamically based on how many cards are visible
  const visibleCardsCount = [showLaundry, showCleaning, showCarWash, true].filter(Boolean).length;
  const gridColsClass = visibleCardsCount === 4
    ? "lg:grid-cols-4"
    : visibleCardsCount === 3
      ? "lg:grid-cols-3"
      : "lg:grid-cols-2";

  return (
    <>
      {location.pathname !== "/provider/dashboard" ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <LayoutDashboard size={24} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground">
              Dashboard Coming Soon
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We're building your dashboard experience. Soon you'll be able to
              track orders, earnings, and performance all in one place.
            </p>
          </div>
        </div>
      ) : (
        <div className="container-grid py-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("providerDashboard")}
          </h1>

          {/* Row 1 Large Cards */}
          <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${gridColsClass}`}>
            {showLaundry && (
              <DashboardCard
                label="Laundry Orders"
                value={dashboardData?.laundry_orders || 0}
                icon={Shirt}
                iconColorClass="text-primary bg-primary/10"
              />
            )}
            {showCleaning && (
              <DashboardCard
                label="House Cleaning"
                value={dashboardData?.house_cleaning_orders || 0}
                icon={Sparkles}
                iconColorClass="text-emerald-600 bg-emerald-50"
              />
            )}
            {showCarWash && (
              <DashboardCard
                label="Car Wash"
                value={dashboardData?.car_wash_orders || 0}
                icon={Car}
                iconColorClass="text-blue-600 bg-blue-50"
              />
            )}
            <DashboardCard
              label={t("totalEarnings")}
              value={`$${(dashboardData?.total_amount || 0).toFixed(2)}`}
              icon={DollarSign}
              iconColorClass="text-primary bg-primary/10"
            />
          </div>

          {/* Row 2 Smaller Cards */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <DashboardCard
              label={t("totalOrders")}
              value={dashboardData?.total_orders || 0}
              icon={ShoppingBag}
              size="small"
            />
            <DashboardCard
              label={t("activeOrders")}
              value={dashboardData?.active_orders || 0}
              icon={Clock}
              size="small"
            />
            <DashboardCard
              label={t("completedOrders")}
              value={dashboardData?.completed_orders || 0}
              icon={CheckCircle}
              size="small"
            />
          </div>

          {/* Charts Row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Orders by Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressCategoryChart
                  data={[
                    ...(showLaundry ? [{ label: "Laundry", value: dashboardData?.laundry_orders || 0, colorClass: "bg-primary", icon: Shirt }] : []),
                    ...(showCleaning ? [{ label: "House Cleaning", value: dashboardData?.house_cleaning_orders || 0, colorClass: "bg-emerald-500", icon: Sparkles }] : []),
                    ...(showCarWash ? [{ label: "Car Wash", value: dashboardData?.car_wash_orders || 0, colorClass: "bg-blue-500", icon: Car }] : []),
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <VerticalBarChart
                  data={(dashboardData?.monthly_revenue || []).map((item: any) => ({
                    label: item.month,
                    value: item.value
                  }))}
                  valueFormatter={(val) => {
                    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
                    return `$${val.toFixed(0)}`;
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
              {t("recentOrders")}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-semibold">
                      {t("orderId")}
                    </th>
                    <th className="pb-2 text-left font-semibold">
                      {t("customer")}
                    </th>
                    <th className="pb-2 text-left font-semibold">
                      Category
                    </th>
                    <th className="pb-2 text-left font-semibold">
                      {t("serviceDate")}
                    </th>
                    <th className="pb-2 text-left font-semibold">
                      {t("status")}
                    </th>
                    <th className="pb-2 text-right font-semibold">
                      {t("amount")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders && orders.length > 0 ? (
                    orders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-2.5 font-medium">
                          ORD-{String(order.id).padStart(3, "0")}
                        </td>

                        <td className="py-2.5 text-muted-foreground">
                          {order.customer?.first_name}{" "}
                          {order.customer?.last_name}
                        </td>

                        <td className="py-2.5 text-muted-foreground">
                          {order.service_category || "Laundry"}
                        </td>

                        <td className="py-2.5 text-muted-foreground">
                          {order.booking_date
                            ? new Date(order.booking_date).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              statusColorMap[order.status?.toLowerCase()] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {capitalizeStatus(order.status || "")}
                          </span>
                        </td>

                        <td className="py-2.5 text-right">
                          ${(order.total_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex flex-col items-center gap-3">
                          {/* Icon */}
                          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-muted">
                            <PackageX
                              size={24}
                              className="text-muted-foreground"
                            />
                          </div>

                          {/* Message */}
                          <p className="text-sm text-muted-foreground">
                            No recent orders found
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};;

export default ProviderDashboard;