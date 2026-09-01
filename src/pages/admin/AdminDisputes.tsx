import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationController from "@/components/ui/PaginationController";
import { assignAgent, getDisputesApi } from "@/api/dispute.api";
import { useNavigate } from "react-router-dom";
import { getSupportAgentsApi } from "@/api/support.api";
import { Input } from "@/components/ui/input";

const AdminDisputes = () => {
  const navigate = useNavigate();
  const [comingSoon, setComingSoon] = useState(true); // true = show Normal UI
  const [disputes, setDisputes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Record<string | number, any>>({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");

  const fetchDisputes = async (
    page = 1,
    search = searchQuery,
    status = statusFilter,
    decision = decisionFilter,
    issue = issueFilter
  ) => {
    setLoading(true);
    try {
      const req: any = {
        page: page,
        limit: 10,
        search: search.trim() || undefined,
        status: status || undefined,
        admin_decision: decision || undefined,
        issue_type: issue || undefined,
      };
      const res: any = await getDisputesApi(req);
      if (res?.data?.success) {
        setDisputes(res.data.data || []);
        setCurrentPage(res.data.pagination?.current_page || page);
        setTotalPages(res.data.pagination?.total_pages || 1);
        setTotalRecords(res.data.pagination?.total_records || 0);
      } else {
        setDisputes([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load disputes");
      setDisputes([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res: any = await getSupportAgentsApi({});
      if (res?.data) {
        setAgents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Initialize selectedAgents map based on assigned_agent in disputes
    const initial: Record<string | number, any> = {};
    disputes.forEach((d) => {
      initial[d.dispute_id] = d.assigned_agent?.id || "";
    });
    setSelectedAgents(initial);
  }, [disputes]);

  useEffect(() => {
    if (comingSoon) {
      fetchAgents();
    }
  }, [comingSoon]);

  useEffect(() => {
    if (comingSoon) {
      const timer = setTimeout(() => {
        fetchDisputes(1, searchQuery, statusFilter, decisionFilter, issueFilter);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, statusFilter, decisionFilter, issueFilter, comingSoon]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDisputes(page, searchQuery, statusFilter, decisionFilter, issueFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDecisionFilter("");
    setIssueFilter("");
  };

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    Boolean(statusFilter) ||
    Boolean(decisionFilter) ||
    Boolean(issueFilter);

  const getStatusBadge = (status: string) => {
    const s = (status || "open").toLowerCase();
    switch (s) {
      case "open":
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200 font-medium">
            Open
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            Under Review
          </Badge>
        );
      case "agent_reviewed":
        return (
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-medium">
            Agent Reviewed
          </Badge>
        );
      case "waiting_admin":
        return (
          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            Waiting Admin
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            Resolved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-medium">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-medium">
            {status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Open"}
          </Badge>
        );
    }
  };

  const getDecisionBadge = (decision: string) => {
    const d = (decision || "pending").toLowerCase();
    switch (d) {
      case "refund":
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200 font-medium">
            Refund
          </Badge>
        );
      case "partial_refund":
        return (
          <Badge className="bg-orange-50 text-orange-800 border border-orange-200 font-medium">
            Partial Refund
          </Badge>
        );
      case "release_payment":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            Release Payment
          </Badge>
        );
      case "reject_dispute":
        return (
          <Badge className="bg-rose-50 text-rose-800 border border-rose-200 font-medium">
            Reject Dispute
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-yellow-50 text-yellow-800 border border-yellow-200 font-medium">
            Pending
          </Badge>
        );
    }
  };

  // 🔥 COMING SOON UI
  if (!comingSoon) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <AlertTriangle size={24} />
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldAlert size={12} /> Disputes Panel
            </span>
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            Disputes Management Coming Soon
          </h2>

          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Admins will soon be able to handle disputes, review evidence, and
            manage refunds from this panel.
          </p>
        </div>
      </div>
    );
  }

  const handleAssign = async (disputeId: any, agentId: any) => {
    setSelectedAgents((prev) => ({ ...prev, [disputeId]: agentId }));
    try {
      const res: any = await assignAgent({
        dispute_id: Number(disputeId),
        agent_id: agentId,
      });

      const message = res?.data?.message || "Agent assigned successfully!";
      toast.success(message);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.response?.data?.message || "Failed to assign agent";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Disputes Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review customer disputes, assign support agents, and monitor resolutions.
          </p>
        </div>

        {totalRecords > 0 && (
          <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg font-medium self-start sm:self-auto">
            Total Disputes: <span className="text-foreground font-semibold">{totalRecords}</span>
          </span>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search by dispute ID, order, customer, provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="agent_reviewed">Agent Reviewed</option>
            <option value="waiting_admin">Waiting Admin</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Final Decision Filter */}
        <div className="w-full sm:w-44">
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Final Decisions</option>
            <option value="pending">Pending</option>
            <option value="refund">Refund</option>
            <option value="partial_refund">Partial Refund</option>
            <option value="release_payment">Release Payment</option>
            <option value="reject_dispute">Reject Dispute</option>
          </select>
        </div>

        {/* Issue Type Filter */}
        <div className="w-full sm:w-44">
          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Issue Types</option>
            <option value="damaged_item">Damaged Item</option>
            <option value="late_delivery">Late Delivery</option>
            <option value="missing_item">Missing Item</option>
            <option value="wrong_service">Wrong Service</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-10 text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
        )}
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
              <p className="text-sm">Loading disputes...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-muted-foreground">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  No disputes found
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {isFiltered
                    ? "No dispute records match your selected filters and search criteria."
                    : "There are currently no disputes raised in the system."}
                </p>
              </div>
              {isFiltered && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                    <TableHead className="w-[110px] font-semibold text-foreground">Dispute ID</TableHead>
                    <TableHead className="w-[100px] font-semibold text-foreground">Order</TableHead>
                    <TableHead className="min-w-[150px] font-semibold text-foreground">Customer</TableHead>
                    <TableHead className="min-w-[150px] font-semibold text-foreground">Provider</TableHead>
                    <TableHead className="min-w-[130px] font-semibold text-foreground">Issue Type</TableHead>
                    <TableHead className="w-[130px] font-semibold text-foreground">Status</TableHead>
                    <TableHead className="w-[140px] font-semibold text-foreground">Final Decision</TableHead>
                    <TableHead className="min-w-[170px] font-semibold text-foreground">Assign Agent</TableHead>
                    <TableHead className="w-[90px] font-semibold text-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((d) => (
                    <TableRow key={d?.dispute_id} className="hover:bg-muted/30 transition-colors">
                      {/* Dispute ID */}
                      <TableCell className="font-semibold font-mono text-primary text-xs">
                        DSP-{d?.dispute_id}
                      </TableCell>

                      {/* Order */}
                      <TableCell className="font-medium text-foreground text-xs font-mono">
                        {d?.booking_number || (d?.booking_id ? `ORD-${d.booking_id}` : "-")}
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">
                          {d?.customer?.name || "Customer"}
                        </div>
                        {d?.customer?.email && (
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {d.customer.email}
                          </div>
                        )}
                      </TableCell>

                      {/* Provider */}
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">
                          {d?.provider?.business_name || "Provider"}
                        </div>
                      </TableCell>

                      {/* Issue Type */}
                      <TableCell>
                        <span className="text-sm font-medium text-foreground capitalize">
                          {d?.issue_type ? d.issue_type.replace(/_/g, " ") : "-"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {getStatusBadge(d?.dispute_status)}
                      </TableCell>

                      {/* Final Decision */}
                      <TableCell>
                        {getDecisionBadge(d?.admin_decision)}
                      </TableCell>

                      {/* Assign Agent */}
                      <TableCell>
                        <select
                          value={selectedAgents[d.dispute_id] || ""}
                          onChange={(e) => handleAssign(d.dispute_id, e.target.value)}
                          className={`rounded-lg border border-input px-2.5 py-1.5 text-xs shadow-xs w-full max-w-[160px]
                            ${
                              d.dispute_status !== "open"
                                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-75"
                                : "bg-background text-foreground cursor-pointer focus:ring-1 focus:ring-primary"
                            }
                          `}
                          disabled={d.dispute_status !== "open"}
                          title={
                            d.dispute_status !== "open"
                              ? "Cannot assign agent for this dispute"
                              : "Select agent to assign"
                          }
                        >
                          <option value="">Select Agent</option>
                          {agents.map((agent) => (
                            <option key={agent?.id} value={agent?.id}>
                              {agent?.first_name} {agent?.last_name}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => navigate(`/admin/disputes/${d.booking_id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination: Only shown when totalPages > 1 and disputes exist */}
        {totalPages > 1 && disputes?.length > 0 && (
          <div className="p-4 border-t border-border bg-card">
            <PaginationController
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDisputes;