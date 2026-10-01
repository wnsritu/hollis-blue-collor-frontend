import { useEffect, useState } from "react";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Eye,
  User,
  Shield,
  Clock,
  Globe,
  Database,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Code,
  CheckCircle2,
  XCircle,
  Info,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { adminApi } from "@/services/admin";
import { getErrorMessage } from "@/services";
import { formatDate as formatDateUtil } from "@/utils/date";
import PaginationController from "@/components/ui/PaginationController";

export interface AuditLogActor {
  id?: number;
  full_name?: string;
  email?: string;
  role_id?: number;
}

export interface AuditLogItem {
  id: number;
  actor_user_id?: number | null;
  actor_role_id?: number | null;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  reason?: string | null;
  message?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  before_json?: Record<string, any> | string | null;
  after_json?: Record<string, any> | string | null;
  meta?: Record<string, any> | string | null;
  created_at?: string;
  createdAt?: string;
  actor?: AuditLogActor | null;
}

export interface AuditLogResponseData {
  items: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function safeParseJson(val: any): Record<string, any> | null {
  if (!val) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return { raw: val };
    }
  }
  return null;
}

function getLogTimestamp(log: AuditLogItem): string {
  const ts = log.created_at || log.createdAt;
  if (!ts) return "N/A";
  const formatted = formatDateUtil(ts, "MMM d, yyyy, h:mm a");
  return formatted || "N/A";
}

function formatIpAddress(ip?: string | null): string {
  if (!ip) return "Internal System";
  if (ip === "::1" || ip === "127.0.0.1") return "Localhost (::1)";
  return ip;
}

function parseUserAgent(ua?: string | null): string {
  if (!ua) return "Unknown Agent";
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("Chrome/")) return "Google Chrome";
  if (ua.includes("Firefox/")) return "Mozilla Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Apple Safari";
  return "Web Browser";
}

function getLogMessage(log: AuditLogItem): { main: string; sub?: string } {
  const beforeObj = safeParseJson(log.before_json);
  const afterObj = safeParseJson(log.after_json);
  const metaObj = safeParseJson(log.meta);

  let msg = log.message || log.reason || "";

  if (msg === "SETTINGS_UPDATED_SUCCESS") {
    msg = "Platform settings updated successfully";
  }

  if (!msg) {
    const act = (log.action || "").toUpperCase();
    if (act.includes("PAYMENT") || act.includes("PAYMENT_STATUS_CHANGE")) {
      const fromSt = beforeObj?.payment_status || beforeObj?.status || "pending";
      const toSt = afterObj?.payment_status || afterObj?.status || "succeeded";
      msg = `Payment status updated: ${fromSt} → ${toSt}`;
    } else if (act.includes("SETTINGS") || act.includes("PLATFORM_SETTINGS")) {
      msg = "Platform settings updated";
    } else if (act.includes("VERIFY") || act.includes("APPROVE")) {
      msg = `${log.entity_type || "Entity"} application approved`;
    } else if (act.includes("REJECT")) {
      msg = `${log.entity_type || "Entity"} application rejected`;
    } else if (act.includes("DEACTIVATE") || act.includes("SUSPEND")) {
      msg = `${log.entity_type || "Entity"} account suspended`;
    } else if (act.includes("ACTIVATE")) {
      msg = `${log.entity_type || "Entity"} account activated`;
    } else {
      msg = `${log.action || "Administrative action"} executed`;
    }
  }

  let sub: string | undefined;
  if (metaObj?.trigger_source) {
    sub = `Source: ${metaObj.trigger_source}${metaObj.payment_intent_id ? ` • ${metaObj.payment_intent_id}` : ""}`;
  } else if (log.reason && log.message && log.reason !== log.message) {
    sub = `Reason: ${log.reason}`;
  }

  return { main: msg, sub };
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "before" | "after" | "meta">("overview");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };

      if (search.trim()) params.search = search.trim();
      if (entityFilter !== "all") params.entity_type = entityFilter;
      if (actionFilter !== "all") params.action = actionFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res: any = await adminApi.getAuditLogs(params);

      const payload: AuditLogResponseData = res?.data?.data || res?.data || res;
      if (Array.isArray(payload?.items)) {
        setLogs(payload.items);
        setTotalPages(payload.pagination?.total_pages || 1);
        setTotalCount(payload.pagination?.total || payload.items.length);
      } else if (Array.isArray(payload)) {
        setLogs(payload as any);
        setTotalPages(1);
        setTotalCount((payload as any).length);
      } else {
        setLogs([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to load audit logs"));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, entityFilter, actionFilter, fromDate, toDate, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAuditLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, entityFilter, actionFilter, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearch("");
    setEntityFilter("all");
    setActionFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const filteredLogs = logs.filter((log) => {
    // Entity filter check (case insensitive)
    if (entityFilter !== "all" && log.entity_type?.toLowerCase() !== entityFilter.toLowerCase()) {
      return false;
    }
    // Action filter check (case insensitive)
    if (actionFilter !== "all" && log.action?.toLowerCase() !== actionFilter.toLowerCase()) {
      return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(q);
    const entityMatch = log.entity_type?.toLowerCase().includes(q) || String(log.entity_id || "").includes(q);
    const actorMatch = log.actor?.full_name?.toLowerCase().includes(q) || log.actor?.email?.toLowerCase().includes(q);
    const msgMatch = log.message?.toLowerCase().includes(q) || log.reason?.toLowerCase().includes(q);
    const ipMatch = log.ip?.toLowerCase().includes(q);
    return actionMatch || entityMatch || actorMatch || msgMatch || ipMatch;
  });

  const getActionBadge = (action: string) => {
    const lower = (action || "").toLowerCase();
    if (lower.includes("create") || lower.includes("approve") || lower.includes("verify") || lower.includes("activate") || lower.includes("succeeded")) {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors">
          <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
          {action}
        </Badge>
      );
    }
    if (lower.includes("delete") || lower.includes("reject") || lower.includes("deactivate") || lower.includes("cancel") || lower.includes("suspend")) {
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition-colors">
          <XCircle className="w-3 h-3 mr-1 inline-block" />
          {action}
        </Badge>
      );
    }
    if (lower.includes("update") || lower.includes("change") || lower.includes("edit") || lower.includes("payment")) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
          <Info className="w-3 h-3 mr-1 inline-block" />
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 hover:bg-slate-500/20 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors">
        {action}
      </Badge>
    );
  };

  const getEntityBadge = (entityType: string, entityId?: number | null) => {
    const formattedType = entityType ? entityType.replace(/_/g, " ") : "Entity";
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
        <Database className="w-3 h-3 text-slate-400" />
        <span>{formattedType}</span>
        {entityId != null && <span className="text-slate-400 font-mono">#{entityId}</span>}
      </span>
    );
  };

  const getActorRoleLabel = (roleId?: number | null) => {
    if (roleId === 1 || roleId === 3) return "Super Admin";
    if (roleId === 2) return "Admin";
    if (roleId === 4) return "Provider";
    if (roleId === 5) return "Customer";
    return "Administrator";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Records & Logs</h1>
              <p className="text-sm text-muted-foreground">
                Maintain and inspect immutable audit trail records for administrative actions across customers, providers, bookings & settings.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchAuditLogs()}
          disabled={loading}
          className="self-start md:self-auto gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Audit Trail
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Audit Logged</p>
            <h3 className="text-2xl font-bold text-foreground">{totalCount}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Current Page Logs</p>
            <h3 className="text-2xl font-bold text-foreground">{filteredLogs.length}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Page</p>
            <h3 className="text-2xl font-bold text-foreground">{page} / {totalPages}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Secured Security Trail</p>
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Encrypted Snapshots</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar using Shadcn Select Dropdowns */}
      <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search action, message, actor, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Filter Dropdown */}
            <Select
              value={entityFilter}
              onValueChange={(val) => {
                setEntityFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] bg-background border-input">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="provider">Providers & Verification</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="booking">Bookings / Orders</SelectItem>
                <SelectItem value="project">Projects & Proposals</SelectItem>
                <SelectItem value="payment">Payments & Refunds</SelectItem>
                <SelectItem value="payout">Payout Queue & Transfers</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="service">Services</SelectItem>
                <SelectItem value="plan">Subscription Plans</SelectItem>
                <SelectItem value="dispute">Disputes & Resolutions</SelectItem>
                <SelectItem value="review">Reviews & Moderation</SelectItem>
                <SelectItem value="platform_settings">Platform Settings</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Filter Dropdown */}
            <Select
              value={actionFilter}
              onValueChange={(val) => {
                setActionFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[190px] bg-background border-input">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="PAYMENT_STATUS_CHANGE">Payment Status Change</SelectItem>
                <SelectItem value="payout.paid">Payout Marked Paid</SelectItem>
                <SelectItem value="platform_settings.update">Settings Update</SelectItem>
                <SelectItem value="provider.verify">Provider Approve/Verify</SelectItem>
                <SelectItem value="provider.reject">Provider Reject</SelectItem>
                <SelectItem value="customer.deactivate">Customer Deactivate</SelectItem>
                <SelectItem value="customer.activate">Customer Activate</SelectItem>
                <SelectItem value="dispute.update_status">Dispute Status Update</SelectItem>
                <SelectItem value="booking.cancel">Booking Cancel</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Inputs */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
              />
              <span>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-hidden"
              />
            </div>

            {(search || entityFilter !== "all" || actionFilter !== "all" || fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 px-2 text-xs">
                <X className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[220px]">Actor / Performer</TableHead>
              <TableHead className="w-[180px]">Action</TableHead>
              <TableHead className="w-[150px]">Target Entity</TableHead>
              <TableHead>Message & Reason</TableHead>
              <TableHead className="w-[140px]">IP Address</TableHead>
              <TableHead className="text-right w-[80px]">Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Fetching administrative audit records...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-base font-semibold text-foreground">No Audit Records Found</p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      No matching audit records were found for the selected filter criteria. Try resetting search filters or date range.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const { main: msgMain, sub: msgSub } = getLogMessage(log);
                const timestampStr = getLogTimestamp(log);
                const ipStr = formatIpAddress(log.ip);

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                        <span>{timestampStr}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {log.actor?.full_name || (log.actor_user_id ? `User #${log.actor_user_id}` : "System Process")}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-primary/10 text-primary font-medium">
                            {getActorRoleLabel(log.actor_role_id || log.actor?.role_id)}
                          </span>
                        </div>
                        {log.actor?.email && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {log.actor.email}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{getActionBadge(log.action || "UNKNOWN")}</TableCell>

                    <TableCell>{getEntityBadge(log.entity_type, log.entity_id)}</TableCell>

                    <TableCell>
                      <div className="max-w-[340px] space-y-0.5">
                        <p className="text-xs font-medium text-foreground truncate" title={msgMain}>
                          {msgMain}
                        </p>
                        {msgSub && (
                          <p className="text-[11px] text-muted-foreground truncate" title={msgSub}>
                            {msgSub}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-sm w-fit">
                          <Globe className="w-3 h-3 text-muted-foreground/70" />
                          {ipStr}
                        </span>
                        {log.user_agent && (
                          <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-muted-foreground/50" />
                            {parseUserAgent(log.user_agent)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          setSelectedLog(log);
                          setActiveTab("overview");
                        }}
                        title="View Full JSON Audit Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="p-4 border-t border-border/60 bg-muted/20">
          <PaginationController
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={limit}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
            loading={loading}
          />
        </div>
      </div>

      {/* JSON & Detail Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-lg font-bold">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <span>Audit Log Entry #{selectedLog.id}</span>
                </div>
                {getActionBadge(selectedLog.action)}
              </DialogTitle>
              <DialogDescription>
                Detailed audit trail breakdown, payload snapshots, and request metadata.
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-2" />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveTab("overview")}
              >
                <Info className="w-3.5 h-3.5" /> Overview
              </Button>
              <Button
                variant={activeTab === "before" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveTab("before")}
              >
                <Code className="w-3.5 h-3.5" /> Before State
              </Button>
              <Button
                variant={activeTab === "after" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveTab("after")}
              >
                <Code className="w-3.5 h-3.5" /> After State
              </Button>
              <Button
                variant={activeTab === "meta" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveTab("meta")}
              >
                <Globe className="w-3.5 h-3.5" /> Metadata & IP
              </Button>
            </div>

            {/* Tab Contents */}
            <div className="py-2">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Action:</span>
                      <span className="font-semibold text-foreground">{selectedLog.action}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Target Entity:</span>
                      <span className="font-semibold text-foreground capitalize">
                        {selectedLog.entity_type} {selectedLog.entity_id != null ? `#${selectedLog.entity_id}` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Logged At:</span>
                      <span className="font-semibold text-foreground">
                        {getLogTimestamp(selectedLog)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Performer / Actor:</span>
                      <span className="font-semibold text-foreground">
                        {selectedLog.actor?.full_name || `User ID ${selectedLog.actor_user_id || "N/A"}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Actor Email:</span>
                      <span className="font-semibold text-foreground">{selectedLog.actor?.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">IP Address:</span>
                      <span className="font-semibold text-foreground">{formatIpAddress(selectedLog.ip)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                    <span className="text-xs font-semibold text-primary block">Summary & Notes:</span>
                    <p className="text-xs text-foreground font-medium">{getLogMessage(selectedLog).main}</p>
                    {getLogMessage(selectedLog).sub && (
                      <p className="text-xs text-muted-foreground">
                        {getLogMessage(selectedLog).sub}
                      </p>
                    )}
                  </div>

                  {selectedLog.user_agent && (
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
                      <span className="text-xs font-semibold text-muted-foreground block">User Agent:</span>
                      <p className="text-[11px] font-mono text-muted-foreground break-all">{selectedLog.user_agent}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "before" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">JSON State Before Action:</span>
                    <span className="text-xs text-emerald-600 font-medium">Sanitized & Redacted</span>
                  </div>
                  <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[350px]">
                    {safeParseJson(selectedLog.before_json)
                      ? JSON.stringify(safeParseJson(selectedLog.before_json), null, 2)
                      : "// No initial state JSON available"}
                  </pre>
                </div>
              )}

              {activeTab === "after" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">JSON State After Action:</span>
                    <span className="text-xs text-emerald-600 font-medium">Sanitized & Redacted</span>
                  </div>
                  <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[350px]">
                    {safeParseJson(selectedLog.after_json)
                      ? JSON.stringify(safeParseJson(selectedLog.after_json), null, 2)
                      : "// No resulting state JSON available"}
                  </pre>
                </div>
              )}

              {activeTab === "meta" && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Request Metadata & Headers:</span>
                  <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[350px]">
                    {safeParseJson(selectedLog.meta)
                      ? JSON.stringify(safeParseJson(selectedLog.meta), null, 2)
                      : "// No extra metadata available"}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminAuditLogs;
