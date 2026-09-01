import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertCircle,
  Eye,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { getDisputesApi } from "@/api/dispute.api";
import { useNavigate } from "react-router-dom";
import { getChatMessages } from "@/services/chat.service";
import PaginationController from "@/components/ui/PaginationController";
import { Input } from "@/components/ui/input";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const SupportDisputes = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");

  // Modals
  const [openChatModal, setOpenChatModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchMessages = async (booking_id: string | number) => {
    try {
      const response = await getChatMessages(booking_id);
      const messagesData =
        response?.data?.data || response?.data || response || [];
      setMessages(messagesData);
      setOpenChatModal(true);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("No chat messages found for this dispute");
    }
  };

  const getEvidenceList = (evidence: any): string[] => {
    try {
      if (Array.isArray(evidence)) return evidence;
      if (typeof evidence === "string") {
        const parsed = JSON.parse(evidence);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return [];
    } catch {
      return typeof evidence === "string" ? [evidence] : [];
    }
  };

  const fetchDisputes = async (
    page = 1,
    search = searchQuery,
    status = statusFilter,
    decision = decisionFilter,
    issue = issueFilter
  ) => {
    try {
      setLoading(true);
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
        setTotalPages(res.data.pagination?.total_pages || 1);
        setTotalRecords(res.data.pagination?.total_records || 0);
        setCurrentPage(res.data.pagination?.current_page || page);
      } else {
        setDisputes([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Failed to load disputes:", err);
      toast.error("Failed to load disputes");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search and filter triggers
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDisputes(1, searchQuery, statusFilter, decisionFilter, issueFilter);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, decisionFilter, issueFilter]);

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
          <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-medium">
            Open
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-medium">
            Under Review
          </Badge>
        );
      case "agent_reviewed":
        return (
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium">
            Agent Reviewed
          </Badge>
        );
      case "waiting_admin":
        return (
          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium">
            Waiting Admin
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium">
            Resolved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Disputes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collect evidence and forward to admin for final decisions. Disputes must
            be reported within 24 hours.
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
                    : "There are currently no disputes reported."}
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
                    <TableHead className="min-w-[140px] font-semibold text-foreground">Issue Type</TableHead>
                    <TableHead className="w-[130px] font-semibold text-foreground">Status</TableHead>
                    <TableHead className="w-[140px] font-semibold text-foreground">Final Decision</TableHead>
                    <TableHead className="w-[100px] font-semibold text-foreground text-center">Evidence</TableHead>
                    <TableHead className="w-[160px] font-semibold text-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((d) => {
                    const evidences = getEvidenceList(d.evidence);
                    return (
                      <TableRow key={d?.dispute_id || d?.id} className="hover:bg-muted/30 transition-colors">
                        {/* Dispute ID */}
                        <TableCell className="font-semibold font-mono text-primary text-xs">
                          {"DSP-"}{d?.dispute_id}
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
                            <div className="text-xs text-muted-foreground truncate max-w-[160px]">
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
                          {d?.customer_description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={d.customer_description}>
                              {d.customer_description}
                            </p>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {getStatusBadge(d?.dispute_status)}
                        </TableCell>

                        {/* Final Decision */}
                        <TableCell>
                          {getDecisionBadge(d?.admin_decision)}
                        </TableCell>

                        {/* Evidence */}
                        <TableCell className="text-center">
                          {evidences.length > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              {evidences.slice(0, 2).map((img: string, idx: number) => {
                                const fullUrl = img.startsWith("http") ? img : `${BASE_URL}${img}`;
                                return (
                                  <img
                                    key={idx}
                                    src={fullUrl}
                                    alt={`Evidence ${idx + 1}`}
                                    onClick={() => setPreviewImage(fullUrl)}
                                    className="h-8 w-8 object-cover rounded border border-border hover:opacity-80 transition cursor-pointer"
                                  />
                                );
                              })}
                              {evidences.length > 2 && (
                                <span
                                  onClick={() => {
                                    const first = evidences[0];
                                    setPreviewImage(first.startsWith("http") ? first : `${BASE_URL}${first}`);
                                  }}
                                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  +{evidences.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => navigate(`/support-dashboard/disputes/${d?.booking_id}`)}
                              title="View Dispute Details"
                            >
                              <Eye size={14} className="mr-1" />
                              Details
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => {
                                setSelectedDispute(d);
                                fetchMessages(d.booking_id);
                              }}
                              title="View Chat Messages"
                            >
                              <MessageSquare size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-card">
            <PaginationController
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-background rounded-2xl p-2 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Evidence Preview"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Chat Messages Modal */}
      {openChatModal && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden text-left border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Chat Messages
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{selectedDispute?.customer?.name || "Customer"}</span> ↔{" "}
                  <span className="font-medium text-foreground">{selectedDispute?.provider?.business_name || "Provider"}</span>
                  {selectedDispute?.booking_number && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-muted font-mono">
                      {selectedDispute.booking_number}
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setOpenChatModal(false)}
                className="p-2 hover:bg-muted rounded-full transition text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="h-[400px] overflow-y-auto p-5 bg-muted/20 space-y-4">
              {messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <MessageSquare size={32} className="mb-2 opacity-40" />
                  No chat messages found for this order.
                </div>
              ) : (
                messages.map((msg) => {
                  const isProvider = msg.sender_role === "provider";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isProvider ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-xs text-sm ${
                          isProvider
                            ? "bg-primary text-primary-foreground rounded-br-xs"
                            : "bg-card text-foreground border border-border rounded-bl-xs"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isProvider
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDisputes;
