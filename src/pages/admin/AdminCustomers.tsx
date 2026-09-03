import { useEffect, useState } from "react";
import {
  Search,
  User,
  Eye,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  PauseCircle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/api/modules/admin.api";
import { getErrorMessage } from "@/lib/api/errors";

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === "object") {
    const d = (res as { data?: unknown }).data;
    if (Array.isArray(d)) return d as T[];
  }
  return [];
}

export interface CustomerUser {
  id: number;
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  status?: string;
  is_active?: boolean;
  jobs_count?: number;
  total_spend?: number;
  created_at?: string;
  createdAt?: string;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await adminApi.listCustomers(params);
      const list = unwrapList<CustomerUser>(res);
      setCustomers(list);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to fetch customer list"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const toggleCustomerStatus = async (customer: CustomerUser) => {
    const currentStatus = String(customer.status || "").toLowerCase();
    const isActive = currentStatus === "active" || customer.is_active === true;
    const nextAction = isActive ? "deactivate" : "activate";

    try {
      setActionLoading(customer.id);
      if (isActive) {
        await adminApi.deactivateCustomer(customer.id);
        toast.success(`Account for ${customer.full_name || customer.name || "Customer"} has been suspended.`);
      } else {
        await adminApi.activateCustomer(customer.id);
        toast.success(`Account for ${customer.full_name || customer.name || "Customer"} has been activated.`);
      }

      const newStatus = isActive ? "inactive" : "active";
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, status: newStatus, is_active: !isActive }
            : c
        )
      );

      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, status: newStatus, is_active: !isActive } : null
        );
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, `Failed to ${nextAction} customer account`));
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Customer Management
        </h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} registered customer accounts on the platform
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email or city…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by account status"
            className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold">Customer Name</TableHead>
              <TableHead className="font-bold">Email Address</TableHead>
              <TableHead className="font-bold">Location</TableHead>
              <TableHead className="font-bold text-right">Bookings</TableHead>
              <TableHead className="font-bold text-right">Lifetime Spend</TableHead>
              <TableHead className="font-bold">Member Since</TableHead>
              <TableHead className="font-bold">Account Status</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User size={28} className="text-muted-foreground/60" />
                    <p className="font-semibold">No customers found</p>
                    <p className="text-xs text-muted-foreground">
                      No customer account matches your query or status filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => {
                const name = c.full_name || c.name || "Customer";
                const isActive =
                  String(c.status || "").toLowerCase() === "active" || c.is_active === true;
                const locationStr =
                  c.city && c.state
                    ? `${c.city}, ${c.state}`
                    : c.city || c.state || "Not specified";

                return (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-foreground">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="text-left font-bold text-foreground hover:text-accent transition-colors"
                      >
                        {name}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-xs">{locationStr}</TableCell>
                    <TableCell className="text-right font-medium">{c.jobs_count ?? 0}</TableCell>
                    <TableCell className="text-right font-bold text-accent">
                      {formatCurrency(c.total_spend)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(c.created_at || c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? "bg-success-soft text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 size={12} /> Active
                          </>
                        ) : (
                          <>
                            <PauseCircle size={12} /> Suspended
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCustomer(c)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Eye size={13} /> View
                        </Button>
                        <Button
                          size="sm"
                          variant={isActive ? "outline" : "default"}
                          disabled={actionLoading === c.id}
                          onClick={() => void toggleCustomerStatus(c)}
                          className={`h-8 text-xs ${
                            isActive
                              ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                              : ""
                          }`}
                        >
                          {actionLoading === c.id
                            ? "Updating..."
                            : isActive
                            ? "Suspend"
                            : "Reinstate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Dialog
          open={Boolean(selectedCustomer)}
          onOpenChange={(open) => {
            if (!open) setSelectedCustomer(null);
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-accent/10 font-extrabold text-accent text-lg">
                  {(selectedCustomer.full_name || selectedCustomer.name || "C")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    {selectedCustomer.full_name || selectedCustomer.name || "Customer"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Customer ID: {selectedCustomer.id} · Member since{" "}
                    {formatDate(selectedCustomer.created_at || selectedCustomer.createdAt)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/40 p-3 text-xs">
                <div>
                  <span className="block text-[11px] text-muted-foreground">Total Bookings</span>
                  <span className="font-bold text-foreground text-sm">
                    {selectedCustomer.jobs_count ?? 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">Lifetime Spend</span>
                  <span className="font-bold text-accent text-sm">
                    {formatCurrency(selectedCustomer.total_spend)}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">Account Status</span>
                  {(() => {
                    const isActive =
                      String(selectedCustomer.status || "").toLowerCase() === "active" ||
                      selectedCustomer.is_active === true;
                    return (
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive
                            ? "bg-success-soft text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {isActive ? "Active" : "Suspended"}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} className="text-accent shrink-0" />
                  <span className="font-medium text-foreground">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} className="text-accent shrink-0" />
                  <span className="font-medium text-foreground">
                    {selectedCustomer.phone || "No phone provided"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                  <MapPin size={14} className="text-accent shrink-0" />
                  <span className="font-medium text-foreground">
                    {selectedCustomer.address ||
                      (selectedCustomer.city && selectedCustomer.state
                        ? `${selectedCustomer.city}, ${selectedCustomer.state}`
                        : "Location not provided")}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Actions Footer inside modal */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Toggle manual account access:
                </span>
                <div className="flex items-center gap-2">
                  {(() => {
                    const isActive =
                      String(selectedCustomer.status || "").toLowerCase() === "active" ||
                      selectedCustomer.is_active === true;
                    return (
                      <Button
                        size="sm"
                        variant={isActive ? "destructive" : "default"}
                        disabled={actionLoading === selectedCustomer.id}
                        onClick={() => void toggleCustomerStatus(selectedCustomer)}
                        className="gap-1.5 text-xs font-bold"
                      >
                        {isActive ? (
                          <>
                            <PauseCircle size={14} /> Suspend Account
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} /> Activate Account
                          </>
                        )}
                      </Button>
                    );
                  })()}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminCustomers;
