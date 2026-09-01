import { useTranslation } from "react-i18next";
import { DollarSign, Clock, Wallet } from "lucide-react";
import { mockTransactions } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBookingPaymentSummary, getOrderList } from "@/services/order.service";
import { useEffect, useState } from "react";
import PaginationController from "@/components/ui/PaginationController";

const statusColor: Record<string, string> = {
  Approved: "bg-secondary/10 text-secondary",
  Pending: "bg-primary/10 text-primary",
  Rejected: "bg-destructive/10 text-destructive",
};

const ProviderEarnings = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [earning, setEarning] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const totalEarnings = mockTransactions
    .filter((tx) => tx.status === "Paid")
    .reduce((s, tx) => s + tx.amount, 0);
  const pendingPayouts = mockTransactions
    .filter((tx) => tx.status === "Pending")
    .reduce((s, tx) => s + tx.amount, 0);
  const availableBalance = totalEarnings - 155.0;
  const isDashboardAvailable = true; // Set to false to show Coming Soon view

  if (!isDashboardAvailable) {
    // ✅ Coming Soon View
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <DollarSign size={24} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Earnings Dashboard Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We're working on your earnings, payouts, and transaction tracking.
            Stay tuned!
          </p>
        </div>
      </div>
    );
  }

  const fetchOrderEarning = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getBookingPaymentSummary();
      // debugger
      if (response.data.success) {
        const ordersData = response.data.data || {};
        setEarning(ordersData);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders for dashboard
  const fetchOrderList = async (page = 1) => {
    try {
      setLoading(true);
      let reqData = {
        page: page,
        limit: 5,
        status: "",
      };
      const response = await getOrderList(reqData);

      if (response.data.success) {
        const ordersData = response.data.bookings || [];
        setOrders(ordersData);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderEarning();
  }, []);

  useEffect(() => {
    if (true) {
      fetchOrderList(currentPage);
    }
  }, [currentPage]);

  return (
    <div className="container-grid py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("earnings")}
      </h1>

      {/* Wallet Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 card-elevated">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-secondary">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("totalEarnings")}
              </p>
              <p className="text-xl font-bold text-foreground">
                ${earning?.paid?.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 card-elevated">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("pendingPayouts")}
              </p>
              <p className="text-xl font-bold text-foreground">
                ${earning?.pending?.total_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">
          {t("transactions")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-semibold">{t("date")}</th>
                <th className="pb-2 text-left font-semibold">{t("orderId")}</th>
                <th className="pb-2 text-left font-semibold">{t("amount")}</th>
                <th className="pb-2 text-left font-semibold">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((tx, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2.5 text-muted-foreground">{tx?.booking_date}</td>
                  <td className="py-2.5 font-medium">{"ORD-"}{tx?.id}</td>
                  <td className="py-2.5 text-left">${tx?.total_amount.toFixed(2)}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1.5 text-xs font-medium ${
                        tx?.payment_status === "paid"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {tx?.payment_status.charAt(0).toUpperCase() + tx?.payment_status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <PaginationController
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProviderEarnings;
