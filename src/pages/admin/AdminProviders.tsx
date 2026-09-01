import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import PaginationController from "@/components/ui/PaginationController";
import idPlaceholder from "@/assets/govtIdPlaceholder.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
import { Users, Search } from "lucide-react";
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

const AdminProviders = () => {
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
        limit: 10,
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
    // 1. Status/Verification Filter
    if (filter === "Verified" && p.verified !== "verified") return false;
    if (filter === "Pending" && p.verified !== "unverified") return false;
    if (filter === "Inactive" && p.status !== "paused") return false;

    // 2. Search query (matches Name, Business Name, or Location fields: Address, City, State, Country)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${p?.user?.first_name || ""} ${p?.user?.last_name || ""}`.toLowerCase();
      const businessName = (p?.business_name || "").toLowerCase();
      const address = (p?.service_location_address || "").toLowerCase();
      const city = (p?.city || "").toLowerCase();
      const state = (p?.state || "").toLowerCase();
      const country = (p?.country || "").toLowerCase();
      const zip = (p?.zip_code || "").toLowerCase();

      return (
        fullName.includes(q) ||
        businessName.includes(q) ||
        address.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        country.includes(q) ||
        zip.includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Providers
      </h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", "Verified", "Pending", "Inactive"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-foreground" size={16} />
          <Input
            placeholder="Search by name, business, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Name</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Business Name
                </TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="hidden md:table-cell">Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Spinner />
                  </TableCell>
                </TableRow>
              ) : filtered.length > 0 ? (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-foreground">
                      {p?.user.first_name || "TestName"} {p?.user.last_name}
                    </TableCell>

                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.business_name}
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                      {[p.city, p.state, p.country].filter(Boolean).join(", ") || p.service_location_address || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={verificationColors[p.verified] || ""}
                      >
                        {p.verified === "verified"
                          ? "Verified"
                          : p.verified === "rejected"
                            ? "Rejected"
                            : " Unverified"}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {p.rating > 0 ? `⭐ ${p.rating}` : "—"}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(p)}
                        className={
                          p.status === "active"
                            ? "text-red-500 border-red-500 hover:bg-red-50"
                            : "text-green-600 border-green-600 hover:bg-green-50"
                        }
                      >
                        {p.status === "active" ? "Inactive" : "Active"}
                      </Button>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProvider(p)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {/* Icon */}
                      <Users size={28} className="opacity-50" />

                      {/* Main text */}
                      <p className="text-sm font-medium">No providers found</p>

                      {/* Sub text */}
                      <p className="text-xs text-gray-400">
                        No providers available for this filter
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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

                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Location Address</p>
                  <p className="text-sm font-medium text-foreground">
                    {[
                      selectedProvider.service_location_address,
                      selectedProvider.city,
                      selectedProvider.state,
                      selectedProvider.country
                    ].filter(Boolean).join(", ") || "—"}
                  </p>
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
                        ? `${BASE_URL}${selectedProvider.government_id}`
                        : idPlaceholder
                    }
                    alt="gov-id"
                    onError={(e) => {
                      e.currentTarget.src = idPlaceholder;
                    }}
                    className="h-20 w-20 rounded-lg border object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;
