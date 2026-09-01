import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, CreditCard } from "lucide-react";
import { getAgentDashboard } from "@/api/support.api";
import { getDisputesApi } from "@/api/dispute.api";
import toast from "react-hot-toast";

const SupportDashboard = ({ showComingSoon = !true }) => {
  const [stats, setStats] = useState([
    {
      label: "Pending Cases",
      value: 0,
      icon: ClipboardList,
      color: "text-primary",
    },
    {
      label: "Open Disputes",
      value: 0,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "Refund Requests",
      value: 0,
      icon: CreditCard,
      color: "text-secondary",
    },
  ]);

  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    if (!showComingSoon) {
      fetchDashboard();
      fetchDisputes(1);
    }
  }, [showComingSoon]);

  const fetchDashboard = async () => {
    try {
      const res: any = await getAgentDashboard();
      const data = res?.data?.data || {};
      setStats([
        {
          label: "Pending Cases",
          value: data.total_pending_disputes || 0,
          icon: ClipboardList,
          color: "text-primary",
        },
        {
          label: "Open Disputes",
          value: data.waiting_admin || 0,
          icon: AlertTriangle,
          color: "text-destructive",
        },
        {
          label: "Refund Requests",
          value: data.refund_recommended || 0,
          icon: CreditCard,
          color: "text-secondary",
        },
      ]);
    } catch (err) {
      console.error("Error fetching agent dashboard:", err);
    }
  };

  if (showComingSoon) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <AlertTriangle size={24} />
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <AlertTriangle size={12} /> Support Panel
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Support Dashboard Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Manage disputes, refunds, and customer issues easily with our
            upcoming support system.
          </p>
        </div>
      </div>
    );
  }

  const fetchDisputes = async (page = 1) => {
    try {
      const res: any = await getDisputesApi({
        page: page,
        limit: 5,
      });
      if (res?.data?.success) {
        setDisputes(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load disputes");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Support Dashboard
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5 card-elevated"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-accent ${s.color}`}
              >
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Recent Cases
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-semibold">Case ID</th>
                <th className="pb-2 text-left font-semibold">Type</th>
                <th className="pb-2 text-left font-semibold">Customer</th>
                <th className="pb-2 text-left font-semibold">Status</th>
                <th className="pb-2 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">
                    {"CASE-"}
                    {c?.dispute_id}
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {c?.issue_type}
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {c?.customer?.name}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c?.dispute_status === "open" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                    >
                      {c?.dispute_status.toUpperCase().charAt(0) +
                        c?.dispute_status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {c?.created_at ? (() => {
                      const date = new Date(c.created_at);
                      const day = String(date.getDate()).padStart(2, "0");
                      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
                      const year = date.getFullYear();
                      return `${day}-${month}-${year}`;
                    })() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
