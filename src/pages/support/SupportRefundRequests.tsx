import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getProviderChats } from "@/services/chat.service";

// const refundRequests = [
//   {
//     id: "REF-001",
//     orderId: "ORD-198",
//     amount: 24.97,
//     reason: "Damaged items",
//     status: "Pending",
//     date: "2026-03-27",
//   },
//   {
//     id: "REF-002",
//     orderId: "ORD-195",
//     amount: 18.5,
//     reason: "Late delivery",
//     status: "Approved",
//     date: "2026-03-25",
//   },
//   {
//     id: "REF-003",
//     orderId: "ORD-190",
//     amount: 11.97,
//     reason: "Missing items",
//     status: "Rejected",
//     date: "2026-03-22",
//   },
// ];

const statusColor: Record<string, string> = {
  Pending: "bg-primary/10 text-primary",
  Approved: "bg-secondary/10 text-secondary",
  Rejected: "bg-destructive/10 text-destructive",
};

const SupportRefundRequests = () => {
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchRequests();
  // }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await getProviderChats();
      const providersData = res?.data || [];

      setRefundRequests(providersData);
    } catch (err) {
      console.log("ERROR:", err);
      toast.error("Failed to load refund requests.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="m-auto flex flex-col items-center justify-center min-h-[200px] bg-accent rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Coming Soon 🚀
        </h2>
        <p className="text-muted-foreground text-center">
          This feature is under development. Stay tuned for updates!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Refund Requests
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-1">
        {/* Existing requests */}
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground mb-4">
            Previous Requests
          </h2>
          <div className="space-y-3">
            {refundRequests?.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {r.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.orderId} · ${r.amount.toFixed(2)}
                      </p>
                    </div>
                    <Badge className={`border-0 ${statusColor[r.status]}`}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.reason} · {r.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportRefundRequests;
