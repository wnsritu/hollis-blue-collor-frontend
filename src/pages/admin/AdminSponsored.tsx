import { getAllProvider, getAllProviderPlans } from "@/api/admin.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaginationController from "@/components/ui/PaginationController";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  active: "bg-secondary/10 text-green-600 border-secondary/20",
  pending: "bg-amber-500/10 text-yellow-600 border-amber-500/20",
  expired: "bg-muted text-red-600 border-border",
};

const AdminSponsored = () => {
  const showComingSoon = true;

  const [loading, setLoading] = useState(false);
  const [planHistory, setPlanHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add this ref to track if it's the initial load
  const [shouldFetch, setShouldFetch] = useState(false);

  if (!showComingSoon) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <Sparkles size={24} />
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap size={12} /> Admin Feature
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Sponsored Listings Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Manage and promote providers with sponsored listings. This feature
            will be available soon.
          </p>
        </div>
      </div>
    );
  }

  // Fetch providers list
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res: any = await getAllProvider({
        page: 1,
        limit: 100,
      });
      setProviders(res?.data?.data || []);
    } catch (err) {
      console.log("ERROR:", err);
      toast.error("Failed to load providers.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch plans with filters
  const getProviderPlans = async (page = 1, customFilters = null) => {
    try {
      setLoading(true);
      const filters = customFilters || {
        provider_id: selectedProvider || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const body: any = {
        page,
        limit: 10,
        status: "all",
        ...filters,
      };

      const res: any = await getAllProviderPlans(body);

      setPlanHistory(res?.data?.data || []);
      setCurrentPage(res?.data?.pagination?.page || 1);
      setTotalPages(res?.data?.pagination?.totalPages || 1);
      // toast.success(res?.data?.message || "Provider plans loaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load provider plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    getProviderPlans();
  }, []);

  useEffect(() => {
    if (shouldFetch) {
      getProviderPlans(1);
      setShouldFetch(false);
    }
  }, [selectedProvider, startDate, endDate, shouldFetch]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    getProviderPlans(page);
  };

  const handleFilter = () => {
    setShouldFetch(true);
  };

  const handleReset = () => {
    setSelectedProvider("");
    setStartDate("");
    setEndDate("");
    setShouldFetch(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Sponsored Listings
      </h1>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Activate Sponsored Listing
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-[2fr,1fr,1fr,0.5fr] items-end">
            
            {/* Provider Filter */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full min-w-[210px] rounded-xl border border-border px-3 py-2.5 text-sm shadow-sm bg-background"
              >
                <option value="">Select Provider</option>
                {providers
                  .filter((p) => p.status === "active")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.business_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                className="w-full block min-w-[160px]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                className="w-full block min-w-[160px]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 items-end">
              <Button className="px-4 py-2 text-sm" onClick={handleFilter}>
                Filter
              </Button>

              <Button
                className="px-4 py-2 text-sm bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Plan History Table */}
      {planHistory?.length > 0 ? (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Business Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {planHistory?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium text-foreground">
                    {plan.provider_name}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {plan?.start_date || "Pending Activation"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {plan?.end_date || "Pending Activation"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    <Badge
                      variant="outline"
                      className={
                        statusColors[plan.status.toLowerCase()] ||
                        "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {plan.status.charAt(0).toUpperCase() +
                        plan.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <PaginationController
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </Card>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh] px-4">
          <div className="text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <Package size={24} />
            </div>
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Zap size={12} /> Admin Feature
              </span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              No Plan History Found
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              There are currently no plans activated for any provider. Once providers purchase plans, they will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSponsored;
