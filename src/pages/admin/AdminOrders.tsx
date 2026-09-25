import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Briefcase,
  CalendarDays,
  Clock,
  FileText,
  Search,
  Tag,
  Star,
  Quote,
  RotateCcw,
  Loader2,
  MapPin,
  User,
  Building2,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, PageHeader, StatusPill, Stars } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import PaginationController from "@/components/ui/PaginationController";
import { getOrderDetails, getOrderList } from "@/services/order.service";
import { formatDate } from "@/utils/date";
import { useDebounce } from "@/hooks/useDebounce";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending Acceptance" },
  { value: "accepted", label: "Confirmed" },
  { value: "in_process", label: "In Progress" },
  { value: "finished", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

export const AdminOrders: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);

  const timeline = [
    "pending",
    "accepted",
    "in_process",
    "finished",
    "delivered",
  ];
  const currentIdx = timeline.indexOf(selected?.status);

  const [orders, setOrders] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const debouncedSearch = useDebounce(searchFilter, 350);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch orders with server-side filters
  const fetchOrderList = async (
    page = currentPage,
    status = statusFilter,
    search = debouncedSearch
  ) => {
    try {
      setLoading(true);

      const reqData: any = {
        page: page,
        limit: 10,
        sortBy: "id",
        sortOrder: "desc",
      };

      if (status && status !== "all") {
        reqData.status = status;
      }
      if (search && search.trim()) {
        reqData.search = search.trim();
      }

      const response = await getOrderList(reqData);

      if (response?.data?.success) {
        const ordersData = response.data.bookings || [];
        setOrders(ordersData);
        const total = response.data.total ?? response.data.count ?? ordersData.length;
        const totalP = response.data.pagination?.totalPages || response.data.total_pages || Math.ceil(total / 10) || 1;
        setTotalPages(totalP);
        setCurrentPage(response.data.pagination?.page || response.data.current_page || page);
        setTotalBookingsCount(total);
      } else {
        setOrders([]);
        setTotalPages(1);
        setTotalBookingsCount(0);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setTotalPages(1);
      setTotalBookingsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setCurrentPage(1);
      fetchOrderList(1, statusFilter, debouncedSearch);
    }
  }, [id, statusFilter, debouncedSearch]);

  useEffect(() => {
    if (id) {
      handleOpen(id);
    }
  }, [id]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrderList(page, statusFilter, debouncedSearch);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchFilter("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const isFiltered = Boolean(searchFilter.trim()) || statusFilter !== "all";

  const handleOpen = async (bookingId: any) => {
    try {
      setLoading(true);
      const orderRes = await getOrderDetails(bookingId);
      const orderData =
        orderRes?.data?.data?.booking ||
        orderRes?.data?.booking ||
        orderRes?.data?.data ||
        orderRes?.data;

      if (!orderData) throw new Error("No order data");
      setSelected(orderData);
    } catch (orderError) {
      console.error("Order fetch failed:", orderError);
      toast.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Header matching reference UI */}
      <PageHeader
        title="Service Bookings"
        subtitle={`${totalBookingsCount || orders.length} service bookings across the platform`}
      />

      {/* Filter Row matching reference UI */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[260px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search service name, customer or provider…"
            className="pl-9 h-10 text-xs sm:text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
          <SelectTrigger className="w-56 h-10">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-10 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={14} /> Reset Filters
          </Button>
        )}
      </div>

      {/* Table Container Card matching reference UI */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span>Loading service bookings...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Briefcase}
              title="No service bookings found"
              description={
                isFiltered
                  ? "No bookings match your current search or status filter."
                  : "There are currently no service bookings on the platform."
              }
              action={
                isFiltered ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service &amp; Booking ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => {
                const isFixed =
                  !order.project_id &&
                  order.order_type !== "custom_request" &&
                  order.booking_type !== "request_quote";

                const serviceName =
                  order.service_type?.name ||
                  order.service?.service_type?.name ||
                  order.service_category ||
                  order.service?.category_name ||
                  order.project?.title ||
                  "Service Details";

                const bookingDisplayId =
                  order.booking_number ||
                  (order.id ? `BKG-${String(order.id).padStart(5, "0")}` : "BKG-0");

                const customerName =
                  order.customer?.full_name ||
                  [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") ||
                  order.customer_name ||
                  "Customer";

                const providerName =
                  order.provider?.business_name ||
                  order.provider?.user?.full_name ||
                  order.provider_name ||
                  "—";

                const formattedDateStr = order.booking_date
                  ? formatDate(order.booking_date)
                  : "Flexible";

                const timeSlot = order.time_slot || order.schedule?.time_slot;
                const formattedTimeStr =
                  timeSlot?.name ||
                  timeSlot?.slot_name ||
                  (timeSlot?.start_time ? `${timeSlot.start_time}` : order.time || "Scheduled");

                return (
                  <TableRow
                    key={order.id}
                    onClick={() => handleOpen(order.id)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <p className="font-bold text-foreground max-w-xs truncate">{serviceName}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{bookingDisplayId}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                          isFixed
                            ? "bg-primary-soft text-primary"
                            : "bg-accent-soft text-accent-soft-foreground font-bold"
                        }`}
                      >
                        {isFixed ? <Tag size={12} /> : <FileText size={12} />}
                        {isFixed ? "Fixed Service" : "Request a Quote"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {customerName}
                    </TableCell>
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {providerName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays size={13} /> {formattedDateStr}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                        <Clock size={12} /> {formattedTimeStr}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm whitespace-nowrap">
                      {usd(order.total_amount || 0)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusPill status={order.status || "pending"} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-bold font-display flex items-center gap-2">
                Booking #{selected?.booking_number || selected?.id}
              </DialogTitle>
              {selected?.status && <StatusPill status={selected.status} />}
            </div>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-2">
              {/* Service & Schedule Overview */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-foreground text-sm">
                  <span>
                    {selected.service?.service_type?.name ||
                      selected.service_category ||
                      selected.service?.category_name ||
                      "Service Details"}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {selected.service?.category_name || "Home Services"}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 pt-1 border-t border-border/60 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-primary" />
                    <span>
                      {selected.schedule?.date
                        ? formatDate(selected.schedule.date)
                        : selected.booking_date
                        ? formatDate(selected.booking_date)
                        : "Date Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    <span>
                      {selected.schedule?.time_slot?.name ||
                        selected.time_slot?.name ||
                        "Scheduled Slot"}
                      {selected.schedule?.time_slot?.start_time
                        ? ` (${selected.schedule.time_slot.start_time} - ${selected.schedule.time_slot.end_time || ""})`
                        : ""}
                    </span>
                  </div>
                </div>

                {selected.service_address?.address && (
                  <div className="flex items-start gap-1.5 pt-1 border-t border-border/60 text-muted-foreground">
                    <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                    <span>{selected.service_address.address}</span>
                  </div>
                )}
              </div>

              {/* Customer & Provider Information */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                {/* Customer Box */}
                <div className="rounded-xl border border-border p-3.5 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                    <User size={14} className="text-primary" /> Customer
                  </div>
                  <p className="font-semibold text-foreground">
                    {selected.customer?.full_name ||
                      [selected.customer?.first_name, selected.customer?.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      "Customer"}
                  </p>
                  {selected.customer?.email && (
                    <p className="text-muted-foreground truncate">{selected.customer.email}</p>
                  )}
                  {selected.customer?.phone && (
                    <p className="text-muted-foreground">{selected.customer.phone}</p>
                  )}
                </div>

                {/* Provider Box */}
                <div className="rounded-xl border border-border p-3.5 bg-card space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                    <Building2 size={14} className="text-primary" /> Provider
                  </div>
                  <p className="font-semibold text-foreground">
                    {selected.provider?.business_name || "Professional"}
                  </p>
                  {selected.provider?.service_location_address && (
                    <p className="text-muted-foreground text-[11px] line-clamp-2">
                      {selected.provider.service_location_address}
                    </p>
                  )}
                  {selected.provider?.rating && (
                    <div className="flex items-center gap-1 pt-0.5">
                      <Stars rating={Number(selected.provider.rating)} size={12} />
                      <span className="font-bold text-[11px] text-foreground">
                        {Number(selected.provider.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Breakdown Card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={15} className="text-primary" /> Pricing &amp; Payment Summary
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      selected.payment_status === "paid" || selected.payment_status === "success" || selected.payment_status === "succeeded"
                        ? "bg-success-soft text-success border-success/20 font-bold"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold"
                    }
                  >
                    {selected.payment_status === "paid" || selected.payment_status === "success" ? "Paid" : "Pending Payment"}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal (Services)</span>
                    <span className="font-semibold text-foreground">
                      {usd(selected.pricing?.subtotal || selected.total_amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service &amp; Platform Fee</span>
                    <span className="font-semibold text-foreground">
                      +{usd(selected.pricing?.service_fee || 0)}
                    </span>
                  </div>
                  <Separator className="my-1.5" />
                  <div className="flex items-center justify-between text-sm font-bold text-foreground pt-0.5">
                    <span>Total Customer Amount</span>
                    <span className="text-primary font-extrabold text-base">
                      {usd(selected.pricing?.total || selected.total_amount || 0)}
                    </span>
                  </div>
                </div>

                {selected.payment?.payment_date && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border">
                    <span>Payment Date:</span>
                    <span className="font-semibold text-foreground">
                      {formatDate(selected.payment.payment_date, "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                )}
              </div>

              {/* Order Timeline */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-3 font-bold">
                  Order Lifecycle Progress
                </p>

                {selected?.status === "cancelled" || selected?.status === "rejected" ? (
                  <div className="flex flex-col items-center justify-center py-4 gap-1.5 rounded-xl bg-destructive-soft/10 text-destructive text-xs">
                    <p className="font-semibold">
                      Booking {selected?.status === "cancelled" ? "Cancelled" : "Rejected"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      This order is no longer active.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center w-full px-2">
                    {timeline.map((step, i) => {
                      const done = i <= currentIdx;

                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                              ${
                                done
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              ✓
                            </div>

                            <span className="text-[11px] mt-1 capitalize font-medium">
                              {step.replace("_", " ")}
                            </span>
                          </div>

                          {i < timeline.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-1 rounded-full ${
                                i < currentIdx ? "bg-primary" : "bg-muted"
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Customer Rating & Review Card */}
              {selected.review && selected.review.rating > 0 && (
                <section className="pt-3 border-t border-border">
                  <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-success" /> Customer Submitted Review
                  </p>

                  <Card className="border border-border bg-card rounded-xl shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Stars rating={Number(selected.review.rating)} size={14} />
                          <span className="font-bold text-xs text-foreground ml-1">
                            {selected.review.rating} / 5 Stars
                          </span>
                        </div>
                        {selected.review.created_at && (
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(selected.review.created_at)}
                          </span>
                        )}
                      </div>

                      {selected.review.comment && (
                        <div className="relative group">
                          <Quote
                            size={16}
                            className="absolute left-0 top-0 text-primary/20"
                          />
                          <p className="text-xs leading-relaxed text-muted-foreground pl-5 italic bg-muted/30 p-2.5 rounded-lg">
                            "{selected.review.comment}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Server-side Pagination */}
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
