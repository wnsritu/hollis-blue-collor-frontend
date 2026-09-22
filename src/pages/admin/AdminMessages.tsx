import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import {
  MessageSquare,
  Search,
  Eye,
  CheckCircle,
  Ban,
  User,
  X,
  ShieldAlert,
  FileText,
  Lock,
  RotateCcw,
  Briefcase,
  Calendar,
  Image as ImageIcon,
  Paperclip,
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
import adminApi from "@/services/admin/admin.service";
import { getUserChats, getChatMessages } from "@/services/chat/chat.service";
import { BADGE_DEFAULT } from "@/styles";

const AdminMessages = () => {
  const [activeTab, setActiveTab] = useState<"all_chats" | "chat_reports">("all_chats");

  // ─── Tab 1: All Platform Chats State ───
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatSearch, setChatSearch] = useState("");

  // ─── Tab 2: Chat Reports State ───
  const [chatReports, setChatReports] = useState<any[]>([]);
  const [chatReportsLoading, setChatReportsLoading] = useState(false);
  const [chatReportsPage, setChatReportsPage] = useState(1);
  const [chatReportsTotalPages, setChatReportsTotalPages] = useState(1);
  const [chatReportsTotalRecords, setChatReportsTotalRecords] = useState(0);
  const [chatReportStatusFilter, setChatReportStatusFilter] = useState<string>("all");

  // ─── Inspection Modal State ───
  const [selectedInspection, setSelectedInspection] = useState<{
    type: "chat" | "report";
    data: any;
  } | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch All Chats for Admin
  const fetchAllChats = async () => {
    setChatsLoading(true);
    try {
      const res: any = await getUserChats();
      const list = res?.data || res || [];
      setChats(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("FETCH ALL CHATS ERROR:", err);
      toast.error("Failed to load platform chats");
      setChats([]);
    } finally {
      setChatsLoading(false);
    }
  };

  // Fetch Chat Reports
  const fetchChatReports = async (page = 1, status = chatReportStatusFilter) => {
    setChatReportsLoading(true);
    try {
      const res: any = await adminApi.getChatReports({
        page,
        limit: 10,
        status: status !== "all" ? status : undefined,
      });

      const rawData = res?.data || res;
      const reportsList = Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData)
        ? rawData
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const pagination = res?.pagination || rawData?.pagination || res?.data?.pagination || {};
      const currentPage = Number(pagination.page || pagination.current_page || page);
      const totalPages = Number(pagination.totalPages || pagination.total_pages || 1);
      const totalRecords = Number(pagination.total || pagination.total_records || reportsList.length);

      setChatReports(reportsList);
      setChatReportsPage(currentPage);
      setChatReportsTotalPages(totalPages);
      setChatReportsTotalRecords(totalRecords);
    } catch (err) {
      console.error("FETCH CHAT REPORTS ERROR:", err);
      toast.error("Failed to load chat reports");
      setChatReports([]);
      setChatReportsTotalPages(1);
      setChatReportsTotalRecords(0);
    } finally {
      setChatReportsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "all_chats") {
      fetchAllChats();
    } else {
      fetchChatReports(1, chatReportStatusFilter);
    }
  }, [activeTab, chatReportStatusFilter]);

  // Open Chat Room Transcript Inspector Modal
  const handleInspectChat = async (chat: any) => {
    setInspectionLoading(true);
    setSelectedInspection({ type: "chat", data: chat });
    setTranscriptMessages([]);
    try {
      const res: any = await getChatMessages(chat.id);
      const msgs = res?.data || res || [];
      setTranscriptMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error("INSPECT CHAT ERROR:", err);
      toast.error("Failed to load chat messages");
    } finally {
      setInspectionLoading(false);
    }
  };

  // Open Report Inspection Modal
  const handleInspectReport = async (reportId: number) => {
    setInspectionLoading(true);
    setSelectedInspection(null);
    setTranscriptMessages([]);
    try {
      const res: any = await adminApi.getChatReportById(reportId);
      const resData = res?.data?.data || res?.data;
      if (resData) {
        const reportObj = resData.report || resData;
        const msgs = resData.messages || resData.transcript || resData.chat_messages || [];
        setSelectedInspection({ type: "report", data: reportObj });
        setTranscriptMessages(msgs);
      } else {
        toast.error("Report details not found");
      }
    } catch (err) {
      console.error("GET REPORT DETAIL ERROR:", err);
      toast.error("Failed to load report transcript");
    } finally {
      setInspectionLoading(false);
    }
  };

  // Update Report Status / Block Chat
  const handleUpdateReportStatus = async (
    reportId: number,
    newStatus: "reviewed" | "closed",
    action?: "block_chat"
  ) => {
    setActionLoading(true);
    try {
      const payload: any = { status: newStatus };
      if (action) payload.action = action;

      await adminApi.updateChatReportStatus(reportId, payload);
      toast.success(
        action === "block_chat"
          ? "Report updated & Chat Room blocked successfully!"
          : `Report marked as ${newStatus}!`
      );

      if (selectedInspection?.data && selectedInspection.data.id === reportId) {
        setSelectedInspection({
          ...selectedInspection,
          data: {
            ...selectedInspection.data,
            status: newStatus,
            chat: {
              ...(selectedInspection.data.chat || {}),
              is_blocked: action === "block_chat" ? true : selectedInspection.data.chat?.is_blocked,
            },
          },
        });
      }

      fetchChatReports(chatReportsPage, chatReportStatusFilter);
      if (activeTab === "all_chats") fetchAllChats();
    } catch (err: any) {
      console.error("UPDATE REPORT STATUS ERROR:", err);
      const msg = err?.response?.data?.message || "Failed to update chat report";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChatReportsPageChange = (page: number) => {
    setChatReportsPage(page);
    fetchChatReports(page, chatReportStatusFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getReportStatusBadge = (status: string) => {
    const s = (status || "open").toLowerCase();
    switch (s) {
      case "open":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-medium hover:bg-amber-100 transition-colors">
            Open
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-medium hover:bg-blue-100 transition-colors">
            Reviewed
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-medium hover:bg-emerald-100 transition-colors">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline" className={BADGE_DEFAULT}>{status}</Badge>;
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter((c) => {
    if (!chatSearch.trim()) return true;
    const term = chatSearch.toLowerCase();
    const idStr = String(c.id || "").toLowerCase();
    const customer = String(c.customer?.full_name || "").toLowerCase();
    const provider = String(c.provider?.business_name || c.provider?.user?.full_name || "").toLowerCase();
    const project = String(c.project?.title || "").toLowerCase();
    const booking = String(c.booking_number || c.booking?.booking_number || "").toLowerCase();
    return (
      idStr.includes(term) ||
      customer.includes(term) ||
      provider.includes(term) ||
      project.includes(term) ||
      booking.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="text-primary" size={26} />
            Chat & Conduct Moderation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor all project and booking conversations, inspect transcripts, and handle user reports.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("all_chats")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "all_chats"
                ? "bg-background text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare size={15} />
            <span>All Conversations</span>
            {chats.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-bold">
                {chats.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("chat_reports")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "chat_reports"
                ? "bg-background text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert size={15} />
            <span>Reported Conversations</span>
            {chatReportsTotalRecords > 0 && (
              <span className="ml-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 font-bold">
                {chatReportsTotalRecords}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TAB 1: ALL PLATFORM CONVERSATIONS           */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "all_chats" && (
        <>
          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Search chats by ID, customer name, provider name, or project title..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-9 pr-8 bg-background"
              />
              {chatSearch && (
                <button
                  onClick={() => setChatSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllChats}
              disabled={chatsLoading}
              className="gap-1.5 h-10"
            >
              <RotateCcw size={14} /> Refresh
            </Button>
          </div>

          {/* All Chats Table */}
          <Card className="overflow-hidden border-border">
            <CardContent className="p-0">
              {chatsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                  <p className="text-sm">Loading active platform conversations...</p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-muted-foreground">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      No conversations found
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      {chatSearch
                        ? "No chat rooms match your search query."
                        : "There are currently no active chat rooms on the platform."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                        <TableHead className="w-[100px] font-semibold text-foreground">Chat ID</TableHead>
                        <TableHead className="w-[120px] font-semibold text-foreground">Type</TableHead>
                        <TableHead className="min-w-[160px] font-semibold text-foreground">Customer</TableHead>
                        <TableHead className="min-w-[160px] font-semibold text-foreground">Provider</TableHead>
                        <TableHead className="min-w-[180px] font-semibold text-foreground">Reference (Project/Order)</TableHead>
                        <TableHead className="w-[110px] font-semibold text-foreground">Status</TableHead>
                        <TableHead className="w-[130px] font-semibold text-foreground">Last Updated</TableHead>
                        <TableHead className="w-[140px] font-semibold text-foreground text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChats.map((chat) => (
                        <TableRow key={chat.id} className="hover:bg-muted/30 transition-colors">
                          {/* Chat ID */}
                          <TableCell className="font-semibold font-mono text-primary text-xs">
                            CHAT-{chat.id}
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            {chat.project ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-[11px] gap-1 transition-colors">
                                <Briefcase size={11} /> Project
                              </Badge>
                            ) : chat.booking ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-[11px] gap-1 transition-colors">
                                <Calendar size={11} /> Booking
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 text-[11px] transition-colors">
                                General
                              </Badge>
                            )}
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div className="font-medium text-foreground text-xs">
                              {chat.customer?.full_name || `Customer #${chat.customer_id}`}
                            </div>
                          </TableCell>

                          {/* Provider */}
                          <TableCell>
                            <div className="font-medium text-foreground text-xs">
                              {chat.provider?.business_name || chat.provider?.user?.full_name || `Provider #${chat.provider_id}`}
                            </div>
                          </TableCell>

                          {/* Reference */}
                          <TableCell>
                            <div className="text-xs font-medium text-foreground truncate max-w-[180px]">
                              {chat.project?.title || chat.booking_number || (chat.booking_id ? `ORD-${chat.booking_id}` : "-")}
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            {chat.is_blocked ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 text-[11px] transition-colors">
                                Blocked
                              </Badge>
                            ) : chat.is_read_only ? (
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 text-[11px] transition-colors">
                                Read Only
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[11px] transition-colors">
                                Active
                              </Badge>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : "-"}
                          </TableCell>

                          {/* Action */}
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1"
                              onClick={() => handleInspectChat(chat)}
                            >
                              <Eye size={13} /> View Transcript
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TAB 2: REPORTED CONVERSATIONS               */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "chat_reports" && (
        <>
          {/* Chat Reports Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-600" />
              <span className="text-sm font-semibold text-foreground">
                Reported Chat Conduct Moderation
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Status Filter:</span>
              <select
                value={chatReportStatusFilter}
                onChange={(e) => setChatReportStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs font-medium rounded-lg border border-input bg-background text-foreground shadow-xs focus:outline-hidden"
              >
                <option value="all">All Reports</option>
                <option value="open">Open Only</option>
                <option value="reviewed">Reviewed Only</option>
                <option value="closed">Closed Only</option>
              </select>
            </div>
          </div>

          {/* Chat Reports Table */}
          <Card className="overflow-hidden border-border">
            <CardContent className="p-0">
              {chatReportsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                  <p className="text-sm">Loading chat reports...</p>
                </div>
              ) : chatReports.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-muted-foreground">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      No chat reports found
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      There are currently no reported chat conversations matching your filter.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                        <TableHead className="w-[100px] font-semibold text-foreground">Report ID</TableHead>
                        <TableHead className="w-[100px] font-semibold text-foreground">Chat ID</TableHead>
                        <TableHead className="min-w-[170px] font-semibold text-foreground">Reporter</TableHead>
                        <TableHead className="min-w-[200px] font-semibold text-foreground">Reason / Details</TableHead>
                        <TableHead className="w-[110px] font-semibold text-foreground">Status</TableHead>
                        <TableHead className="w-[130px] font-semibold text-foreground">Date Reported</TableHead>
                        <TableHead className="w-[160px] font-semibold text-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chatReports.map((report) => (
                        <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold font-mono text-amber-700 text-xs">
                            RPT-{report.id}
                          </TableCell>

                          <TableCell className="font-medium text-foreground text-xs font-mono">
                            CHAT-{report.chat_id}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {report.reporter?.full_name?.charAt(0) || <User size={14} />}
                              </div>
                              <div>
                                <div className="font-medium text-foreground text-xs">
                                  {report.reporter?.full_name || `User #${report.reported_by_user_id}`}
                                </div>
                                {report.reporter?.email && (
                                  <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                                    {report.reporter.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-medium text-xs text-foreground">
                              {report.reason || "Policy / Conduct Violation"}
                            </div>
                            {report.details && (
                              <div className="text-[11px] text-muted-foreground line-clamp-1">
                                {report.details}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>{getReportStatusBadge(report.status)}</TableCell>

                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "-"}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs gap-1"
                                onClick={() => handleInspectReport(report.id)}
                              >
                                <Eye size={13} /> View Transcript
                              </Button>

                              {report.status !== "closed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-emerald-700 hover:bg-emerald-50"
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateReportStatus(report.id, "closed")}
                                  title="Mark as Resolved / Close"
                                >
                                  <CheckCircle size={14} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {chatReportsTotalPages > 1 && chatReports?.length > 0 && (
              <div className="p-4 border-t border-border bg-card">
                <PaginationController
                  currentPage={chatReportsPage}
                  totalPages={chatReportsTotalPages}
                  onPageChange={handleChatReportsPageChange}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* TRANSCRIPT INSPECTION MODAL                 */}
      {/* ═══════════════════════════════════════════ */}
      {(selectedInspection || inspectionLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-primary" size={20} />
                <h3 className="font-semibold text-base text-foreground">
                  {selectedInspection?.type === "report"
                    ? `Reported Chat Inspection (RPT-${selectedInspection.data?.id || "..."})`
                    : `Chat Transcript Inspection (CHAT-${selectedInspection?.data?.id || "..."})`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {inspectionLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                  <p className="text-sm">Fetching conversation transcript history...</p>
                </div>
              ) : (
                <>
                  {/* Summary Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border text-xs">
                    {selectedInspection?.type === "report" ? (
                      <>
                        <div>
                          <span className="text-muted-foreground">Reporter:</span>
                          <div className="flex items-center gap-2 mt-1">
                            {selectedInspection.data?.reporter?.profile_image && (
                              <img
                                src={resolveMediaUrl(selectedInspection.data.reporter.profile_image)}
                                alt=""
                                className="h-6 w-6 rounded-full object-cover border border-border"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-foreground">
                                {selectedInspection.data?.reporter?.full_name || `User #${selectedInspection.data?.reported_by_user_id}`}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{selectedInspection.data?.reporter?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Report Reason & Details:</span>
                          <p className="font-semibold text-amber-700 mt-0.5">
                            {selectedInspection.data?.reason || "Policy Violation"}
                          </p>
                          {selectedInspection.data?.details && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{selectedInspection.data.details}</p>
                          )}
                        </div>

                        <div>
                          <span className="text-muted-foreground">Chat Room Participants:</span>
                          <div className="mt-1 space-y-0.5 text-[11px]">
                            <p>
                              <strong className="text-foreground">Customer:</strong>{" "}
                              {selectedInspection.data?.chat?.customer?.full_name || `Customer #${selectedInspection.data?.chat?.customer_id}`}
                            </p>
                            <p>
                              <strong className="text-foreground">Provider:</strong>{" "}
                              {selectedInspection.data?.chat?.provider?.business_name || selectedInspection.data?.chat?.provider?.user?.full_name || `Provider #${selectedInspection.data?.chat?.provider_id}`}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Report Status & Room State:</span>
                          <div className="mt-1 flex items-center gap-2">
                            {getReportStatusBadge(selectedInspection.data?.status)}
                            {selectedInspection.data?.chat?.is_blocked ? (
                              <span className="text-red-600 font-bold flex items-center gap-1 text-[11px]">
                                <Lock size={12} /> BLOCKED
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[11px]">ACTIVE</span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-muted-foreground">Customer:</span>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedInspection?.data?.customer?.full_name || `Customer #${selectedInspection?.data?.customer_id}`}
                          </p>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Provider:</span>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedInspection?.data?.provider?.business_name || selectedInspection?.data?.provider?.user?.full_name || `Provider #${selectedInspection?.data?.provider_id}`}
                          </p>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Reference:</span>
                          <p className="font-semibold text-foreground mt-0.5 truncate">
                            {selectedInspection?.data?.project?.title || selectedInspection?.data?.booking_number || "Direct Chat"}
                          </p>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Room Status:</span>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedInspection?.data?.is_blocked ? (
                              <span className="text-red-600 font-bold flex items-center gap-1">
                                <Lock size={12} /> BLOCKED
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold">ACTIVE</span>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Transcript Header */}
                  <div className="flex items-center justify-between pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText size={14} /> Full Message Transcript History
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Total Messages: {transcriptMessages.length}
                    </span>
                  </div>

                  {/* Chat Messages Log */}
                  <div className="bg-muted/20 border border-border rounded-xl p-4 max-h-[320px] overflow-y-auto space-y-3">
                    {transcriptMessages.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        No chat messages recorded in this conversation transcript.
                      </p>
                    ) : (
                      transcriptMessages.map((msg: any, idx: number) => {
                        const chatData = selectedInspection?.data?.chat || selectedInspection?.data;
                        const senderId = Number(msg.sender_id);

                        let senderName = msg.sender?.full_name;
                        if (!senderName) {
                          if (chatData?.customer && Number(chatData.customer.id) === senderId) {
                            senderName = `${chatData.customer.full_name} (Customer)`;
                          } else if (chatData?.provider) {
                            const pName = chatData.provider.business_name || chatData.provider.user?.full_name || "Provider";
                            senderName = `${pName} (Provider)`;
                          } else if (selectedInspection?.data?.reporter && Number(selectedInspection.data.reporter.id) === senderId) {
                            senderName = `${selectedInspection.data.reporter.full_name} (Reporter)`;
                          } else {
                            senderName = msg.sender_role ? `${msg.sender_role.toUpperCase()} (User #${senderId})` : `User #${senderId}`;
                          }
                        }

                        const fileUrl = msg.file_url ? resolveMediaUrl(msg.file_url) : null;
                        const isImage = msg.type === "image" || (fileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(fileUrl));

                        return (
                          <div
                            key={msg.id || idx}
                            className="p-3.5 rounded-xl border border-border bg-card text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground border-b border-border/40 pb-1.5">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <User size={13} className="text-primary" />
                                {senderName}
                              </span>
                              <span className="font-mono text-[10px]">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ""}
                              </span>
                            </div>

                            {/* Message Text */}
                            {msg.message && (
                              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                                {msg.message}
                              </p>
                            )}

                            {/* Image Preview / File Attachment */}
                            {fileUrl && (
                              <div className="pt-1 space-y-1.5">
                                {isImage ? (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                                      <ImageIcon size={12} /> Image Attachment:
                                    </span>
                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="block max-w-sm group">
                                      <img
                                        src={fileUrl}
                                        alt={msg.file_name || "Attachment"}
                                        className="rounded-lg border border-border object-cover max-h-52 w-full hover:opacity-95 transition-opacity shadow-xs"
                                      />
                                    </a>
                                  </div>
                                ) : (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/20"
                                  >
                                    <Paperclip size={13} />
                                    <span>{msg.file_name || "View Attachment File"}</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/40 gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedInspection(null)}>
                Close Window
              </Button>

              {selectedInspection?.type === "report" && (
                <div className="flex items-center gap-2">
                  {selectedInspection.data?.status !== "reviewed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={actionLoading}
                      onClick={() => handleUpdateReportStatus(selectedInspection.data.id, "reviewed")}
                    >
                      <CheckCircle size={13} /> Mark Reviewed
                    </Button>
                  )}

                  {selectedInspection.data?.status !== "closed" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
                      disabled={actionLoading}
                      onClick={() => handleUpdateReportStatus(selectedInspection.data.id, "closed")}
                    >
                      <CheckCircle size={13} /> Resolve & Close
                    </Button>
                  )}

                  {!selectedInspection.data?.chat?.is_blocked && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={actionLoading}
                      onClick={() =>
                        handleUpdateReportStatus(selectedInspection.data.id, "closed", "block_chat")
                      }
                    >
                      <Ban size={13} /> Block Chat Room
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
