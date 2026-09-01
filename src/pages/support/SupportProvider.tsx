import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import PaginationController from "@/components/ui/PaginationController";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminProviders } from "@/data/adminMockData";
import {
  pauseProvider,
  resumeProvider,
  searchProviders,
} from "@/services/provider.service";
import { Provider } from "@/types/provider.types";
import { verifyProvider } from "@/services/provider.service";
import { formatPhone } from "@/utils/format";
import { Star, Users } from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { getAllProvider } from "@/api/admin.api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const statusColors: Record<string, string> = {
  active: "bg-secondary/10 text-secondary border-secondary/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  paused: "bg-muted text-muted-foreground border-border",
};

const verificationColors: Record<string, string> = {
  verified: "bg-secondary/10 text-secondary border-secondary/20",
  unverified: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const SupportProvider = () => {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProviders(currentPage);
  }, [currentPage]);

  const fetchProviders = async (page = 1) => {
    try {
      setLoading(true);

      const res: any = await getAllProvider({
        page,
        limit: 6,
      });

      // ✅ ALWAYS correct path: res.data.data
      const providersData = res?.data?.data || [];

      setProviders(providersData);

      setTotalPages(res?.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.log("ERROR:", err);
      toast.error("Failed to load providers.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status: "verified" | "rejected") => {
    if (!selectedProvider) {
      toast.error("No provider selected.");
      return;
    }

    try {
      await toast.promise(
        verifyProvider({
          id: selectedProvider.id,
          verified: status,
        }),
        {
          loading: "Updating provider...",
          success:
            status === "verified" ? "Provider approved." : "Provider rejected.",
          error: (err) => err?.response?.data?.message || "Verification failed",
        },
      );

      await fetchProviders();
      setSelectedProvider(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleStatus = async (provider: Provider) => {
    const oldStatus = provider.status;
    const newStatus = oldStatus === "active" ? "paused" : "active";

    // ✅ 1. instant UI update
    setProviders((prev) =>
      prev.map((p) => (p.id === provider.id ? { ...p, status: newStatus } : p)),
    );

    try {
      // ✅ 2. API call
      if (oldStatus === "active") {
        await pauseProvider(provider.id, "Paused by admin");
        toast.success("Provider Inactivated.");
      } else {
        await resumeProvider(provider.id);
        toast.success("Provider activated");
      }
    } catch (err) {
      console.log("ERROR:", err);

      // ❌ 3. rollback if failed
      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id ? { ...p, status: oldStatus } : p,
        ),
      );
      toast.error("Action failed.");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // smooth UX
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const filtered = providers.filter((p) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      p.business_name?.toLowerCase().includes(term) ||
      `${p.user?.first_name} ${p.user?.last_name}`.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filter === "All") return true;
    if (filter === "Verified") return p.verified === "verified";
    if (filter === "Pending") return p.verified === "unverified";
    if (filter === "Inactive") return p.status === "paused";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Providers Profile
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Input
            placeholder="Search by business or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-card"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Verified", "Pending", "Inactive"].map((tab) => (
              <Button
                key={tab}
                variant={filter === tab ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tab)}
                className="text-xs"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Business Name</TableHead>
              <TableHead className="font-semibold">Provider Name</TableHead>
              <TableHead className="font-semibold">Rating</TableHead>
              <TableHead className="font-semibold">Verification</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center py-4">
                    <Spinner className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No providers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium text-foreground">
                    {provider.business_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {provider.user?.first_name} {provider.user?.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-600">
                        {provider.rating}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize ${provider.verified === "verified"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : provider.verified === "rejected"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                    >
                      {provider.verified}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize ${provider.status === "active"
                          ? "bg-green-100 text-green-600 border-green-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}
                    >
                      {provider.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(provider)}
                        className={
                          provider.status === "active"
                            ? "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                            : "border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                        }
                      >
                        {provider.status === "active" ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex justify-center">
          <PaginationController
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Provider Detail Modal */}
      <Dialog
        open={!!selectedProvider}
        onOpenChange={() => setSelectedProvider(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedProvider?.user?.first_name || "TestName"}{" "}
                    {selectedProvider?.user?.last_name || "TestName"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Business Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedProvider.business_name}
                  </p>
                </div>

                {/* ✅ NEW: Email */}
                <div>
                  <p className="text-xs text-muted-foreground">Email ID</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedProvider.user.email || "—"}
                  </p>
                </div>

                {/* ✅ NEW: Phone */}
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatPhone(selectedProvider.user.phone || "—")}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Verification</p>
                  <Badge
                    variant="outline"
                    className={
                      verificationColors[selectedProvider.verified] || ""
                    }
                  >
                    {selectedProvider.verified === "verified"
                      ? "Verified"
                      : selectedProvider.verified === "rejected"
                        ? "Rejected"
                        : "Unverified"}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={statusColors[selectedProvider.status] || ""}
                  >
                    {selectedProvider.status === "paused"
                      ? "Inactive"
                      : selectedProvider.status.charAt(0).toUpperCase() +
                      selectedProvider.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* ✅ Documents (real images) */}
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                <div className="mt-2 flex gap-3">
                  {/* Profile Photo */}
                  {selectedProvider?.profile_photo ? (
                    <img
                      src={`${BASE_URL}${selectedProvider.profile_photo}`}
                      alt="profile"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold border">
                      {selectedProvider?.user?.first_name?.charAt(0)?.toUpperCase()}
                      {selectedProvider?.user?.last_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  {/* Government ID */}
                  <img
                    src={
                      selectedProvider?.government_id
                        ? `${BASE_URL}${selectedProvider.government_id.replace(/"/g, "")}`
                        : ""
                    }
                    alt="gov-id"
                    onError={(e) => (e.currentTarget.src = "")}
                    className="h-20 w-20 rounded-lg object-cover border"
                  />
                </div>
              </div>
            </div>
          )}

          {/* <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleVerify("rejected")}
              disabled={selectedProvider?.verified !== "unverified"}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleVerify("verified")}
              disabled={selectedProvider?.verified === "verified"}
            >
              Approve
            </Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportProvider;
