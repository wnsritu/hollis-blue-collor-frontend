import { useTranslation } from "react-i18next";
import {
  Truck,
  PackageCheck,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  Package,
  Star,
  Eye,
  ChevronRight,
  ShoppingBag,
  DollarSign,
  Settings,
  MoreHorizontal,
  MoreVertical,
  Shirt,
  Sparkles,
  Car,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveOrderBookingState, clearAllBookingState } from "@/utils/bookingState";
import { Progress } from "@/components/ui/progress";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getOrderList,
  getOrderDetails,
  updateOrderStatus,
} from "@/services/order.service";
import { DashboardCard } from "@/components/DashboardWidgets";
import { getDashboardApi } from "@/api/booking.api";

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
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

  // Fetch all orders and dashboard stats for dashboard view
  const fetchOrderList = async () => {
    try {
      let reqData = {
        page: 1,
        limit: 10,
        status: "",
      };
      const [orderRes, statsRes]: any = await Promise.all([
        getOrderList(reqData),
        getDashboardApi()
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

  // Fetch single order details for tracking
  const fetchOrderDetails = async () => {
    try {
      const response: any = await getOrderDetails(id);
      if (response.success) {
        setSelectedOrder(response.data);
        updateCurrentStep(response.data.status);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentStep = (status) => {
    const stepIndex = trackingSteps.findIndex((step) => step.status === status);
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
      in_process: {
        label: "In Progress",
        className: "bg-purple-100 text-purple-700",
      },
      finished: { label: "Finished", className: "bg-green-100 text-green-700" },
      delivered: {
        label: "Delivered",
        className: "bg-emerald-100 text-emerald-700",
      },
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-700",
      },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} border-0`}>{config.label}</Badge>
    );
  };

  const cancelBooking = async (id: number, newStatus: string) => {
    try {
      let reqData = {
        booking_id: id,
        status: newStatus,
      };
      const response: any = await updateOrderStatus(reqData);
      if (response.status) {
        // console.log(response.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // If viewing single order tracking
  if (id && selectedOrder) {
    return (
      <div className="container-grid py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Track Your Order
              </h1>
              <p className="text-muted-foreground mt-1">
                Order ID:{" "}
                {selectedOrder.order_id ||
                  `ORD-${selectedOrder.id?.toString().padStart(3, "0")}`}
              </p>
            </div>
            {getStatusBadge(selectedOrder.status)}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tracking Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-base font-semibold text-foreground mb-6">
                  Order Progress
                </h3>

                <Progress
                  value={((currentStep + 1) / trackingSteps.length) * 100}
                  className="mb-8 h-2"
                />

                <div className="relative">
                  <div className="flex justify-between flex-wrap gap-4">
                    {trackingSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index <= currentStep;
                      const isCurrent = index === currentStep;
                      return (
                        <div
                          key={step.label}
                          className="flex flex-col items-center flex-1 min-w-[60px]"
                        >
                          <div
                            className={`
                              flex h-10 w-10 items-center justify-center rounded-full 
                              transition-all duration-300
                              ${isCompleted
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                              }
                              ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}
                            `}
                          >
                            <Icon size={20} />
                          </div>
                          <p
                            className={`
                            mt-2 text-xs font-medium text-center
                            ${isCompleted ? "text-foreground" : "text-muted-foreground"}
                          `}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <div className="mt-1 flex items-center gap-1">
                              <Clock size={12} className="text-primary" />
                              <span className="text-xs text-primary">
                                In Progress
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Updates */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-base font-semibold text-foreground mb-4">
                  Live Updates
                </h3>
                <div className="space-y-4">
                  {selectedOrder.timeline?.length > 0 ? (
                    selectedOrder.timeline.map((update, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 mt-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">
                            {update.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(update.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No updates yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details Sidebar */}
          <div className="space-y-6">
            {/* Provider Info */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                  Provider Details
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={
                      selectedOrder?.provider?.profile_photo
                        ? `${BASE_URL}${selectedOrder?.provider?.profile_photo}`
                        : "/default-profile.png"
                    }
                    alt={selectedOrder.provider?.business_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <Link
                      to={`/provider/${selectedOrder.provider?.id || selectedOrder.provider_id || selectedOrder.provider?.user_id}?from=dashboard&category=${selectedOrder.category_id || (selectedOrder.service_category === "House Cleaning" ? 2 : selectedOrder.service_category === "Car Wash" ? 3 : 1)}`}
                      onClick={() => saveOrderBookingState(selectedOrder)}
                    >
                      <p className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer hover:underline">
                        {selectedOrder.provider?.business_name || "Provider Name"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <Star
                        size={12}
                        className="text-yellow-500 fill-yellow-500"
                      />
                      <span className="text-xs text-muted-foreground">
                        {selectedOrder.provider?.rating || "New"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Phone size={14} className="mr-2" /> Contact Provider
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageCircle size={14} className="mr-2" /> Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type</span>
                    <span className="text-foreground font-medium">
                      {selectedOrder.service_type?.name ||
                        selectedOrder.service_type_name ||
                        "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Date</span>
                    <span className="text-foreground font-medium">
                      {selectedOrder.booking_date
                        ? new Date(
                          selectedOrder.booking_date,
                        ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Slot</span>
                    <span className="text-foreground font-medium">
                      {selectedOrder.time_slot || "-"}
                    </span>
                  </div>
                  {selectedOrder.pickup_address && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Pickup Address
                      </span>
                      <span className="text-foreground font-medium text-right">
                        {selectedOrder.pickup_address}
                      </span>
                    </div>
                  )}
                  <hr className="border-border my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total Amount</span>
                    <span className="text-primary">
                      $
                      {(parseFloat(selectedOrder.total_amount) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
                    Items
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {item.name || item.item_name} × {item.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          ${((item.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          {selectedOrder.status === "delivered" && (
            <Button onClick={() => navigate(`/rating/${selectedOrder.id}`)}>
              Rate Provider
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Dashboard View (List of orders)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {location.pathname !== "/dashboard" ? (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center space-y-5">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <ShoppingBag size={24} />
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold text-foreground">
              Dashboard Coming Soon
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Track your orders, spending, and activity all in one place. We're
              working on bringing this feature to you.
            </p>
          </div>
        </div>
      ) : (
        <div className="container-grid py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your order summary
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <DashboardCard
              label="Active Orders"
              value={stats.activeOrders}
              icon={ShoppingBag}
              iconColorClass="text-blue-600 bg-blue-50"
            />
            <DashboardCard
              label="Completed Orders"
              value={stats.completedOrders}
              icon={CheckCircle}
              iconColorClass="text-green-600 bg-green-50"
            />
            <DashboardCard
              label="Total Spent"
              value={`$${stats.totalSpent.toFixed(2)}`}
              icon={DollarSign}
              iconColorClass="text-amber-600 bg-amber-50"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <DashboardCard
              label="Laundry Orders"
              value={stats.laundryOrders}
              icon={Shirt}
              iconColorClass="text-primary bg-primary/10"
            />
            <DashboardCard
              label="House Cleaning"
              value={stats.houseCleaningOrders}
              icon={Sparkles}
              iconColorClass="text-emerald-600 bg-emerald-50"
            />
            <DashboardCard
              label="Car Wash"
              value={stats.carWashOrders}
              icon={Car}
              iconColorClass="text-blue-600 bg-blue-50"
            />
          </div>

          {/* Recent Orders Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Recent Orders
              </h2>
            </div>

            {orders.length > 0 ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Provider
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Service Type
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-muted-foreground font-medium">
                          View
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-s text-foreground">
                            {order.order_id ||
                              `ORD-${order.id.toString().padStart(3, "0")}`}
                          </td>
                          <td className="px-4 py-3 text-foreground font-medium">
                            {order.provider?.id || order.provider_id ? (
                              <Link
                                to={`/provider/${order.provider?.id || order.provider_id}?from=dashboard&category=${order.category_id || (order.service_category === "House Cleaning" ? 2 : order.service_category === "Car Wash" ? 3 : 1)}`}
                                onClick={() => saveOrderBookingState(order)}
                                className="text-foreground hover:text-primary hover:underline transition-colors font-medium"
                              >
                                {order.provider?.business_name || order.provider_name || "Provider"}
                              </Link>
                            ) : (
                              order.provider?.business_name || order.provider_name || "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {order.service_category || "Laundry"}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {order.service_type_id == 1
                              ? "In-home"
                              : order.service_type_id == 2
                                ? "Pick-up"
                                : "Drop-off"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {order.booking_date
                              ? new Date(order.booking_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(order?.status)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            ${(parseFloat(order.total_amount) || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-primary"
                              onClick={() => navigate(`/order/${order.id}`)}
                            >
                              View Order
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    <ShoppingBag size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    No orders yet
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start by booking your first laundry service
                  </p>
                  <Button className="mt-4" onClick={() => {
                    clearAllBookingState();
                    navigate("/search");
                  }}>
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerDashboard;
