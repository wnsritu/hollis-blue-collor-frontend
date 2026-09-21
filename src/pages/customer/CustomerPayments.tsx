import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  Loader2,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, StatCard, EmptyState, StatusPill } from "@/components/shared/primitives";
import { appointmentApi } from "@/services/booking";
import { normalizeBooking } from "@/utils/bookingAdapter";
import toast from "react-hot-toast";

export const CustomerPayments: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.listMine();
      const list = (res as any)?.data || res || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load payments data", err);
      toast.error("Failed to load payment transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const normalizedBookings = bookings.map((b) => normalizeBooking(b));

  // Compute metrics
  const totalPaid = normalizedBookings.reduce((sum, b) => {
    const isPaid =
      b.isPaid ||
      (b.paymentStatus || "").toLowerCase() === "paid" ||
      (b.paymentStatus || "").toLowerCase() === "success" ||
      (b.paymentStatus || "").toLowerCase() === "succeeded" ||
      b.status === "Completed";
    return isPaid ? sum + (b.totalAmount || 0) : sum;
  }, 0);

  const completedCount = normalizedBookings.filter(
    (b) =>
      b.isPaid ||
      (b.paymentStatus || "").toLowerCase() === "paid" ||
      b.status === "Completed"
  ).length;

  const pendingCount = normalizedBookings.filter(
    (b) =>
      !b.isPaid &&
      (b.paymentStatus || "").toLowerCase() !== "paid" &&
      b.status !== "Cancelled"
  ).length;

  // Filtered items
  const filtered = normalizedBookings.filter((b) => {
    const matchesSearch =
      b.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.providerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "completed") {
      return (
        b.isPaid ||
        (b.paymentStatus || "").toLowerCase() === "paid" ||
        b.status === "Completed"
      );
    }
    if (activeTab === "pending") {
      return (
        !b.isPaid &&
        (b.paymentStatus || "").toLowerCase() !== "paid" &&
        b.status !== "Cancelled"
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Invoices"
        subtitle="Track your payments, escrow transactions, and service receipts"
        action={
          <Button onClick={() => navigate("/search")}>
            Book a Service
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Amount Paid"
          value={`$${totalPaid.toFixed(2)}`}
          hint="Completed bookings"
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Paid Bookings"
          value={completedCount}
          hint="Cleared transactions"
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          label="Pending / Escrow"
          value={pendingCount}
          hint="Active or processing"
          icon={Clock}
          tone="warning"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Main Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading payment records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records found"
          description={
            searchQuery
              ? "No transactions match your search criteria."
              : "When you book and pay for services, your transactions and invoices will appear here."
          }
          action={
            <Button onClick={() => navigate("/search")}>
              Find a Professional
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Booking / Reference</th>
                  <th className="px-6 py-3.5">Professional</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => {
                  const isPaid =
                    b.isPaid ||
                    (b.paymentStatus || "").toLowerCase() === "paid" ||
                    (b.paymentStatus || "").toLowerCase() === "success" ||
                    (b.paymentStatus || "").toLowerCase() === "succeeded" ||
                    b.status === "Completed";
                  const price = b.totalAmount || 0;

                  return (
                    <tr
                      key={b.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4 font-medium">
                        <div>
                          <p className="font-semibold text-foreground">{b.displayId}</p>
                          <p className="text-xs text-muted-foreground">{b.categoryName || "Home Service"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">
                          {b.providerName || "Professional"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {b.formattedDate}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        ${price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                              : "bg-amber-500/10 text-amber-600 border border-amber-200"
                          }`}
                        >
                          <ShieldCheck size={12} />
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                        >
                          <Link to={`/customer/bookings/${b.id}`}>
                            View Details <ArrowRight size={13} />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPayments;
