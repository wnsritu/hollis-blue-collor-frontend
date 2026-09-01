import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrderDetails, getOrderList, getRatingByBookingId } from "@/services/order.service";
import { AlertCircle, ChevronDown, ChevronUp, Package, Quote, RotateCcw, Search, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PaginationController from "@/components/ui/PaginationController";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import React from "react";
import { Input } from "@/components/ui/input";

const AdminOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const timeline = [
    "pending",
    "accepted",
    "in_process",
    "finished",
    "delivered",
  ];
  const currentIdx = timeline.indexOf(selected?.status);

  const [orders, setOrders] = useState<any[]>([]);
  const [providerRating, setProviderRating] = useState<any>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const fetchDataRating = async (ratingBookingId: any) => {
    try {
      setLoading(true);
      const response: any = await getRatingByBookingId(ratingBookingId);
      if (response?.data?.success) {
        setProviderRating(response?.data);
      }
    } catch (error) {
      console.error("Error fetching rating:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders with server-side filters
  const fetchOrderList = async (
    page = 1,
    status = statusFilter,
    search = searchFilter,
    date = dateFilter,
    sortBy = sortField,
    order = sortOrder
  ) => {
    try {
      setLoading(true);

      const reqData: any = {
        page: page,
        limit: 10,
        sortBy: sortBy,
        sortOrder: order,
      };

      if (status && status !== "all") {
        reqData.status = status;
      }
      if (search.trim()) {
        reqData.search = search.trim();
      }
      if (date) {
        reqData.booking_date = date;
      }

      const response = await getOrderList(reqData);

      if (response?.data?.success) {
        const ordersData = response.data.bookings || [];
        setOrders(ordersData);
        setTotalPages(response.data.total_pages || 1);
        setCurrentPage(response.data.current_page || page);
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      const timer = setTimeout(() => {
        fetchOrderList(1, statusFilter, searchFilter, dateFilter, sortField, sortOrder);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [id, statusFilter, searchFilter, dateFilter, sortField, sortOrder]);

  useEffect(() => {
    if (id) {
      fetchDataRating(id);
    }
  }, [id]);

  const handleSort = (field: string) => {
    const newOrder = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrderList(page, statusFilter, searchFilter, dateFilter, sortField, sortOrder);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchFilter("");
    setStatusFilter("all");
    setDateFilter("");
    setSortField("id");
    setSortOrder("desc");
  };

  const isFiltered =
    Boolean(searchFilter.trim()) ||
    statusFilter !== "all" ||
    Boolean(dateFilter);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      accepted: { label: "Accepted", className: "bg-blue-100 text-blue-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
      in_process: {
        label: "In Progress",
        className: "bg-purple-100 text-purple-700",
      },
      delivering: {
        label: "Delivering",
        className: "bg-orange-100 text-orange-700",
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

    const config = statusConfig[status?.toLowerCase()] || {
      label: status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Pending",
      className: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={`${config.className} border-0`}>{config.label}</Badge>
    );
  };

  const handleOpen = async (bookingId: any) => {
    try {
      setLoading(true);

      // 1️⃣ Fetch Order Details
      try {
        const orderRes = await getOrderDetails(bookingId);
        const orderData = orderRes?.data?.data;
        if (!orderData) throw new Error("No order data");
        setSelected(orderData); // set popup data
      } catch (orderError) {
        console.error("Order fetch failed:", orderError);
        toast.error("Failed to fetch order details");
        return;
      }

      // 2️⃣ Fetch Rating (optional)
      try {
        const ratingRes = await getRatingByBookingId(bookingId);
        if (ratingRes?.data?.success && ratingRes.data.data) {
          setProviderRating(ratingRes.data);
        } else {
          setProviderRating(null);
        }
      } catch (ratingError) {
        console.error("Rating fetch failed:", ratingError);
        setProviderRating(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Orders
            </h2>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw size={12} />
                Reset Filters
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="p-4 bg-muted/20 border-b border-border flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[260px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <Input
                  placeholder="Search by customer, provider, order ID, or amount..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
            <div className="w-[170px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Service Date
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-card px-3 text-xs text-foreground focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="in_process">In Progress</option>
                <option value="finished">Finished</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs gap-1.5"
              >
                <RotateCcw size={13} /> Reset
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th
                    onClick={() => handleSort("id")}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Order ID</span>
                      {sortField === "id" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />
                      ) : (
                        <ChevronUp size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("customer")}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Customer</span>
                      {sortField === "customer" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />
                      ) : (
                        <ChevronUp size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("provider")}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Provider</span>
                      {sortField === "provider" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />
                      ) : (
                        <ChevronUp size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("booking_date")}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Service Date</span>
                      {sortField === "booking_date" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />
                      ) : (
                        <ChevronUp size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />
                      ) : (
                        <ChevronUp size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("total_amount")}
                    className="px-4 py-3 text-right font-semibold text-muted-foreground cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Amount</span>
                      {sortField === "total_amount" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />
                      ) : (
                        <ChevronUp size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-muted-foreground font-semibold">
                    View
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {order.order_id ||
                          `ORD-${order.id.toString().padStart(3, "0")}`}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {order.customer?.first_name} {order.customer?.last_name}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {order.provider?.business_name ||
                          order.provider_name ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {order.booking_date
                          ? new Date(order.booking_date)
                              .toLocaleDateString("en-GB")
                              .replace(/\//g, "-")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        ${order.total_amount || "0"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpen(order.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={24} className="text-muted-foreground/60" />
                        <p className="font-medium text-foreground">No orders found</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isFiltered
                            ? "No orders match the selected filters."
                            : "There are currently no orders in the system."}
                        </p>
                        {isFiltered && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="mt-2 text-xs"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Dialog Details */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Order {selected?.id}</DialogTitle>
                </DialogHeader>

                {selected && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Customer */}
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="text-sm font-medium text-foreground">
                          {selected.customer?.first_name}{" "}
                          {selected.customer?.last_name}
                        </p>
                      </div>

                      {/* Provider */}
                      <div>
                        <p className="text-xs text-muted-foreground">Provider</p>
                        <p className="text-sm font-medium text-foreground">
                          {selected.provider?.business_name}
                        </p>
                      </div>

                      {/* Amount */}
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-medium text-foreground">
                          ${Number(selected.total_amount).toFixed(2)}
                        </p>
                      </div>

                      {/* Payment */}
                      <div>
                        <p className="text-xs text-muted-foreground">Payment</p>
                        <Badge
                          variant="outline"
                          className={
                            selected.payment_status === "paid"
                              ? "bg-secondary/10 text-secondary border-secondary/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }
                        >
                          {selected.payment_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Order Timeline
                      </p>

                      {selected?.status === "cancelled" ||
                      selected?.status === "rejected" ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                          <p className="text-sm font-semibold text-red-600">
                            Booking{" "}
                            {selected?.status === "cancelled"
                              ? "Cancelled"
                              : "Rejected"}
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            This order is no longer active.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center w-full">
                          {timeline.map((step, i) => {
                            const done = i <= currentIdx;

                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center
                                    ${
                                      done
                                        ? "bg-primary text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    ✓
                                  </div>

                                  <span className="text-xs mt-1 capitalize">
                                    {step.replace("_", " ")}
                                  </span>
                                </div>

                                {i < timeline.length - 1 && (
                                  <div
                                    className={`flex-1 h-1 mx-1 ${
                                      i < currentIdx ? "bg-primary" : "bg-gray-200"
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Rating */}
                {providerRating?.data?.rating > 0 && (
                  <section className="mt-1">
                    <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1">
                      <Star size={16} />
                      Rating
                    </p>

                    <Card className="border border-primary/40 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                      <CardContent className="p-5">
                        <div className="relative group">
                          <Quote
                            size={24}
                            className="absolute left-5 top-0 text-primary/20 opacity-0 group-hover:opacity-100 transition"
                          />

                          <p className="text-sm leading-relaxed text-muted-foreground pl-6">
                            {providerRating?.data?.comment || "No comment provided"}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {providerRating?.data?.customer?.first_name?.charAt(0)}
                            {providerRating?.data?.customer?.last_name?.charAt(0)}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {providerRating?.data?.customer?.first_name}{" "}
                              {providerRating?.data?.customer?.last_name}
                            </p>

                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({
                                length: providerRating?.data?.rating || 0,
                              }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className="fill-blue-500 text-blue-500"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Pagination: only shown when totalPages > 1 and orders exist */}
      {totalPages > 1 && orders?.length > 0 && (
        <div className="mt-4">
          <PaginationController
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default AdminOrders;
