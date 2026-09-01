import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { getAllPlans, getAllProviderPlans, updatePlans } from "@/api/admin.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationController from "@/components/ui/PaginationController";

const AdminFeaturedPricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [planHistory, setPlanHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const showComingSoon = !true;

  const getProviderPlans = async (page = 1) => {
    try {
      setLoading(true);

      let req = {
        page,
        limit: 10,
        status: "all",
      };

      const res: any = await getAllProviderPlans(req);

      setPlanHistory(res?.data?.data || []);
      setCurrentPage(res?.data?.pagination?.page || 1);
      setTotalPages(res?.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load provider plans");
    } finally {
      setLoading(false);
    }
  };

  const getPlans = async () => {
    try {
      setLoading(true);
      const res = await getAllPlans();
      const data = res.data.data;
      setPlans(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showComingSoon) {
      getPlans(); // 🔥 only call API when feature enabled
      getProviderPlans();
    }
  }, [showComingSoon]);

  const handlePriceChange = (id, value) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.id === id ? { ...plan, price: value } : plan)),
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        plans: plans.map((p) => ({
          id: p.id,
          price: Number(p.price),
        })),
      };

      await updatePlans(payload);

      toast.success("Pricing updated successfully ✅");
      await getPlans();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update pricing ❌");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CONDITIONAL UI
  if (showComingSoon) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <DollarSign size={24} />
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap size={12} /> Admin Feature
            </span>
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            Featured Pricing Coming Soon
          </h2>

          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Manage pricing plans for featured providers and boost visibility.
            This feature will be available soon.
          </p>
        </div>
      </div>
    );
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    getProviderPlans(page);
  };

  const getDateDisplay = (plan) => {
    if (plan.status === "pending") {
      return "Pending Activation";
    }

    if (plan.status === "active") {
      return plan.start_date && plan.end_date
        ? `${plan.start_date} → ${plan.end_date}`
        : "Active (Dates loading...)";
    }

    if (plan.status === "expired") {
      return plan.start_date && plan.end_date
        ? `${plan.start_date} → ${plan.end_date}`
        : "Expired";
    }

    return "N/A";
  };

  // ✅ NORMAL UI
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Featured Pricing Management
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Adjust featured provider upgrade pricing plans.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan?.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign size={16} className="text-primary" />
                {plan?.duration_days} Days ({plan?.name})
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={plan.price}
                  onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                />
              </div>

              {/* <Badge className="border-0 bg-secondary/10 text-secondary">
                {plan?.is_active ? "Active" : "Deactive"}
              </Badge> */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
            Pricing Notes
          </h3>

          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              • Featured providers appear higher in search within 10 miles
            </li>
            <li>• Pricing changes take effect immediately for new purchases</li>
            <li>• Existing active plans are not affected by price changes</li>
          </ul>
        </CardContent>
      </Card> */}

      <div className="mt-6">
        <Button onClick={handleSave} disabled={loading}>
          <Save size={16} className="mr-2" />
          {loading ? "Saving..." : "Save Pricing"}
        </Button>
      </div>
      <br />

      <h1 className="font-bold">Feature Providers</h1>
      <Card>
        <CardContent className="p-0">
          {planHistory.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider Name</TableHead>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {planHistory?.map((plan) => (
                  <TableRow key={plan?.id}>
                    <TableCell className="font-medium text-foreground">
                      {plan?.provider_name}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {plan?.plan_name}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {plan?.start_date || "Pending Activation"}
                      {/* {getDateDisplay(plan)} */}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {plan?.end_date || "Pending Activation"}
                      {/* {getDateDisplay(plan)} */}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      <span
                        className={
                          plan?.status === "active"
                            ? "text-green-600"
                            : plan?.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {plan?.status.toUpperCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationController
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
          ) : (
            <div className="flex items-center justify-center min-h-[30vh] p-6">
              <div className="text-center space-y-5">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
                  <DollarSign size={24} />
                </div>

                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Zap size={12} /> Admin Feature
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-foreground">
                  No Featured Plans Found
                </h2>

                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Currently, there are no providers enrolled in featured pricing plans. Once providers purchase a plan, it will appear here.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeaturedPricing;
