import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  Download,
  FileText,
  Flag,
  Image as ImageIcon,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar } from "@/components/shared/primitives";
import { chatApi } from "@/api/modules/chat.api";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer } from "@/constants/roles";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { cn } from "@/lib/utils";

type ChatTab = "project" | "normal";

export const Messages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const userIsCustomer = isCustomer(user?.role_id);
  const side = userIsCustomer ? "customer" : "provider";

  // State
  const [activeTab, setActiveTab] = useState<ChatTab>("project");
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadIdState] = useState<number | string | null>(null);
  const activeThreadIdRef = useRef<number | string | null>(null);

  const setActiveThreadId = (id: number | string | null) => {
    activeThreadIdRef.current = id;
    setActiveThreadIdState(id);
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Attachment State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    name: string;
    url: string;
    type: "image" | "file";
  } | null>(null);

  // Image Lightbox State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Report Modal State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam / Unsolicited messages");
  const [reportDetails, setReportDetails] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load User Threads
  const fetchThreads = async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const res = await chatApi.listUserChats();
      const list = (res as any)?.data || res || [];
      const validThreads = Array.isArray(list) ? list : [];
      setThreads(validThreads);

      const stateSelectedId = (location.state as any)?.selectedChatId;
      const currentActive = activeThreadIdRef.current;
      if (stateSelectedId && !currentActive) {
        setActiveThreadId(stateSelectedId);
      } else if (validThreads.length > 0 && !currentActive) {
        setActiveThreadId(validThreads[0].id || validThreads[0].chat_id);
      }
    } catch (err) {
      if (!silent) {
        console.error("Failed to load chat threads", err);
        toast.error("Failed to load conversations.");
      }
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads(false);

    const interval = setInterval(() => {
      fetchThreads(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Messages for Active Thread with Polling
  useEffect(() => {
    if (!activeThreadId) return;
    let cancelled = false;

    const fetchMessagesForThread = async (silent = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const res = await chatApi.getMessages(activeThreadId);
        const list = (res as any)?.data || res || [];
        if (!cancelled) {
          setMessages(Array.isArray(list) ? list : []);
          try {
            await chatApi.markAsRead({ chat_id: activeThreadId });
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        if (!silent) console.error("Failed to load messages", err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    };

    fetchMessagesForThread(false);

    const msgInterval = setInterval(() => {
      fetchMessagesForThread(true);
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(msgInterval);
    };
  }, [activeThreadId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Derived Title and Subtitle Helpers
  const titleFor = (t: any) => {
    if (!t) return "Conversation";
    if (userIsCustomer) {
      return (
        t.provider?.business_name ||
        t.provider?.user?.full_name ||
        t.other_user?.full_name ||
        "Professional"
      );
    }
    return (
      t.customer?.full_name ||
      t.other_user?.full_name ||
      "Customer"
    );
  };

  const subtitleFor = (t: any) => {
    if (!t) return "";
    if (t.project?.title) return `Project: ${t.project.title}`;
    if (t.booking_id) return `Booking #${t.booking_id}`;
    return "Direct Inquiry";
  };

  const isProjectThread = (t: any) =>
    Boolean(t.project_id || t.booking_id || t.project);

  // Filtered List based on Search & Selected Tab
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const matchesTab =
        activeTab === "project" ? isProjectThread(t) : !isProjectThread(t);

      const title = titleFor(t).toLowerCase();
      const sub = subtitleFor(t).toLowerCase();
      const lastMsg = String(t.last_message || "").toLowerCase();
      const query = q.toLowerCase().trim();

      const matchesSearch =
        !query || title.includes(query) || sub.includes(query) || lastMsg.includes(query);

      return matchesTab && matchesSearch;
    });
  }, [threads, activeTab, q, userIsCustomer]);

  const activeThread = useMemo(() => {
    if (!threads.length) return null;
    if (!activeThreadId) return threads[0];
    return (
      threads.find(
        (t) =>
          String(t.id) === String(activeThreadId) ||
          String(t.chat_id) === String(activeThreadId) ||
          String(t.id || t.chat_id) === String(activeThreadId)
      ) || threads[0]
    );
  }, [threads, activeThreadId]);

  const isThreadBlocked = Boolean(activeThread?.is_blocked || activeThread?.blocked);
  const blockerUserId = activeThread?.blocked_by_user_id || activeThread?.blocked_by;

  const isBlockedByMe = useMemo(() => {
    if (!isThreadBlocked) return false;
    if (blockerUserId !== undefined && blockerUserId !== null) {
      return Number(blockerUserId) === Number(user?.id);
    }
    if (activeThread?.blocked_by_role) {
      return activeThread.blocked_by_role === side;
    }
    return true;
  }, [isThreadBlocked, blockerUserId, user?.id, activeThread?.blocked_by_role, side]);

  const isBlockedByOther = isThreadBlocked && !isBlockedByMe;

  // Handlers
  const handleSend = async () => {
    if ((!draft.trim() && !pendingFile) || !activeThread || isThreadBlocked || sending) return;

    const currentThreadId = activeThread.id || activeThread.chat_id;
    const textToSend = draft.trim();
    setDraft("");
    setSending(true);

    try {
      let payload: any;
      if (pendingFile) {
        payload = new FormData();
        payload.append("chat_id", String(currentThreadId));
        payload.append("chatId", String(currentThreadId));
        if (textToSend) {
          payload.append("message", textToSend);
        }
        payload.append("sender_role", side);
        payload.append("attachment", pendingFile.file);
        payload.append("file", pendingFile.file);
      } else {
        payload = {
          chat_id: currentThreadId,
          chatId: currentThreadId,
          message: textToSend,
          sender_role: side,
        };
      }

      const res = await chatApi.sendMessage(payload);
      const newMsg = (res as any)?.data || res;
      setMessages((prev) => [...prev, newMsg]);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchThreads();
      toast.success("Message sent");
    } catch (err: any) {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Attachment size exceeds 10MB limit.");
        return;
      }
      const isImg = file.type.startsWith("image/");
      const url = URL.createObjectURL(file);
      setPendingFile({
        file,
        name: file.name,
        url,
        type: isImg ? "image" : "file",
      });
      toast.success(`Attached ${file.name}`);
    }
  };

  const handleBlockToggle = async () => {
    if (!activeThread || isBlockedByOther) return;
    const currentId = activeThread.id || activeThread.chat_id;
    try {
      await chatApi.block(currentId);
      if (isBlockedByMe) {
        toast.success(`Unblocked ${titleFor(activeThread)}`);
      } else {
        toast.error(`Blocked ${titleFor(activeThread)}`);
      }
      fetchThreads();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update block status.");
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;
    const currentId = activeThread.id || activeThread.chat_id;
    try {
      await chatApi.report(currentId, { reason: reportReason, details: reportDetails });
      toast.success("Report Submitted", {
        description: "Our safety team will review this conversation within 24 hours.",
      });
      setReportOpen(false);
      setReportDetails("");
    } catch (err) {
      toast.error("Failed to submit report.");
    }
  };

  const handleTabSelect = (tab: ChatTab) => {
    setActiveTab(tab);
    const matchingThreads = threads.filter((t) =>
      tab === "project" ? isProjectThread(t) : !isProjectThread(t)
    );
    if (matchingThreads.length > 0) {
      const firstTabId = matchingThreads[0].id || matchingThreads[0].chat_id;
      setActiveThreadId(firstTabId);
    }
  };

  return (
    <div className="grid h-[calc(100vh-11rem)] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* SIDEBAR CONVERSATIONS LIST */}
      <aside className={cn("flex min-h-0 flex-col border-r border-border", mobileOpen && "hidden lg:flex")}>
        {/* REQUIREMENT TABS: Project / Task Chat vs Normal Chat */}
        <div className="border-b border-border bg-card p-2.5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => handleTabSelect("project")}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                activeTab === "project"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Project / Task
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect("normal")}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                activeTab === "normal"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Normal Chat
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search conversations"
              className="h-9 pl-9"
            />
          </div>
        </div>

        {/* THREAD LIST */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="animate-spin text-primary" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <MessageSquare size={24} className="mx-auto text-muted-foreground/60 mb-2" />
              {q ? "No matching conversations found." : `No ${activeTab === "project" ? "Project/Task" : "Normal"} chats yet.`}
            </div>
          ) : (
            filteredThreads.map((c) => {
              const cid = c.id || c.chat_id;
              const isActive = String(cid) === String(activeThread?.id || activeThread?.chat_id);
              const title = titleFor(c);
              const subtitle = subtitleFor(c);
              const initials = title.slice(0, 2).toUpperCase() || "US";
              const lastTime = c.last_message_time || c.updatedAt || c.lastAt;

              const unreadCount = Number(
                c.unread_count ?? c.unreadCount ?? c.unread ?? c.unread_messages_count ?? 0
              );

              return (
                <button
                  key={cid}
                  onClick={() => {
                    setActiveThreadId(cid);
                    setThreads((prev) =>
                      prev.map((t) =>
                        String(t.id || t.chat_id) === String(cid)
                          ? { ...t, unread_count: 0, unreadCount: 0, unread: 0 }
                          : t
                      )
                    );
                    try {
                      chatApi.markAsRead({ chat_id: cid });
                    } catch {
                      /* ignore */
                    }
                    setMobileOpen(true);
                  }}
                  className={cn(
                    "flex w-full min-w-0 items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/50",
                    isActive && "bg-primary-soft/60"
                  )}
                >
                  <Avatar initials={initials} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{title}</span>
                      {lastTime && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {new Date(lastTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {c.last_message || c.message || (c.attachment ? "📎 Attachment" : "")}
                    </span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* CHAT MAIN CONVERSATION WINDOW */}
      <section className={cn("flex min-h-0 flex-col", !mobileOpen && "hidden lg:flex")}>
        {activeThread ? (
          <>
            {/* CHAT HEADER WITH REPORT / BLOCK MENU */}
            <header className="flex items-center justify-between border-b border-border p-3">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)}>
                  <ArrowLeft size={17} />
                </Button>
                <Avatar initials={titleFor(activeThread).slice(0, 2).toUpperCase()} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-sm">{titleFor(activeThread)}</p>
                    {isBlockedByMe && (
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                        Blocked
                      </span>
                    )}
                    {isBlockedByOther && (
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                        Blocked by User
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {subtitleFor(activeThread)}
                  </p>
                </div>
              </div>

              {/* OPTIONS DROPDOWN MENU */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Conversation options">
                    <MoreVertical size={17} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setReportOpen(true)} className="cursor-pointer gap-2">
                    <Flag size={15} /> Report Conversation
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isBlockedByOther ? (
                    <DropdownMenuItem disabled className="gap-2 text-muted-foreground opacity-50 cursor-not-allowed">
                      <Ban size={15} /> Blocked by User
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={handleBlockToggle}
                      className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Ban size={15} /> {isBlockedByMe ? "Unblock User" : "Block User"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            {/* BLOCKED BANNER */}
            {isBlockedByMe && (
              <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive">
                <ShieldAlert size={15} />
                You have blocked this conversation. Unblock to send and receive messages.
              </div>
            )}
            {isBlockedByOther && (
              <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive">
                <ShieldAlert size={15} />
                You have been blocked by {titleFor(activeThread)}. You can no longer send messages to this user.
              </div>
            )}

            {/* MESSAGES THREAD */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface/60 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Send a message to introduce yourself and discuss project details.
                </div>
              ) : (
                messages.map((m, idx) => {
                  const mine =
                    Number(m.sender_id) === Number(user?.id) ||
                    m.sender_role === side ||
                    m.from === side;

                  const rawFileUrl =
                    m.file_url || m.fileUrl || m.attachment_url || m.attachmentUrl || m.attachment;
                  const fileUrl = resolveMediaUrl(rawFileUrl);
                  const fileName =
                    m.file_name || m.fileName || m.attachment_name || m.attachment || "Attachment Document";

                  const msgType =
                    m.type ||
                    m.attachment_type ||
                    m.attachmentType ||
                    (fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
                      ? "image"
                      : fileUrl
                      ? "document"
                      : "text");

                  const isImage = msgType === "image";
                  const isDocument = msgType === "document" || (!isImage && Boolean(fileUrl));

                  return (
                    <div key={m.id || idx} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-card space-y-2",
                          mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                        )}
                      >
                        {/* IMAGE ATTACHMENT */}
                        {isImage && fileUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(fileUrl)}
                            className="group relative mt-1 block overflow-hidden rounded-xl border border-border/40 bg-black/10 text-left"
                          >
                            <img src={fileUrl} alt={fileName} className="max-w-xs max-h-60 rounded-lg object-cover" />
                          </button>
                        )}

                        {/* DOCUMENT ATTACHMENT */}
                        {isDocument && fileUrl && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              "mt-1.5 flex items-center gap-3 rounded-xl p-3 text-xs font-medium transition-colors border border-border/30",
                              mine
                                ? "bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            )}
                          >
                            <FileText size={20} className="shrink-0" />
                            <div className="flex-1 truncate min-w-0">
                              <p className="font-semibold text-xs truncate">{fileName}</p>
                              <p className="text-[10px] opacity-75">Click to view / download</p>
                            </div>
                            <Download size={14} className="ml-auto shrink-0 opacity-70" />
                          </a>
                        )}

                        {/* MESSAGE TEXT */}
                        {(m.message || m.text) && (
                          <p className="whitespace-pre-wrap">{m.message || m.text}</p>
                        )}

                        {/* TIMESTAMP & READ/SENT STATUS */}
                        <div className={cn("flex items-center justify-end gap-1 text-[10px]", mine ? "opacity-80" : "text-muted-foreground")}>
                          <span>
                            {m.createdAt || m.created_at || m.at
                              ? new Date(m.createdAt || m.created_at || m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </span>
                          {mine && (
                            <span>
                              {m.is_read || m.read ? (
                                <CheckCheck size={14} className="text-emerald-400 font-bold" title="Read" />
                              ) : (
                                <Check size={14} className="opacity-70" title="Sent / Delivered" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* PENDING ATTACHMENT PREVIEW BAR */}
            {pendingFile && (
              <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {pendingFile.type === "image" ? <ImageIcon size={15} className="text-primary" /> : <Paperclip size={15} className="text-primary" />}
                  <span className="truncate font-semibold">{pendingFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPendingFile(null)}>
                  <X size={14} />
                </Button>
              </div>
            )}

            {/* INPUT CONTROLS */}
            <div className="border-t border-border p-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.zip"
                onChange={handleFileSelect}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isThreadBlocked}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file or image"
                  title="Attach file or image"
                >
                  <Paperclip size={16} />
                </Button>
                <Input
                  value={draft}
                  disabled={isThreadBlocked}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={
                    isBlockedByMe
                      ? "User is blocked. Unblock to type…"
                      : isBlockedByOther
                      ? "You have been blocked by this user."
                      : "Write a message…"
                  }
                />
                <Button onClick={handleSend} disabled={isThreadBlocked || sending} aria-label="Send message">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
            <MessageSquare size={36} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold">Select a conversation</p>
            <p className="text-xs">Choose a chat thread from the left to start messaging.</p>
          </div>
        )}
      </section>

      {/* LIGHTBOX IMAGE PREVIEW MODAL */}
      <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/90 border-0 text-white">
          <div className="relative flex items-center justify-center min-h-[300px] max-h-[80vh]">
            {previewImage && (
              <img src={previewImage} alt="Attachment Preview" className="max-h-[80vh] w-auto rounded-lg object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* REPORT CONVERSATION MODAL */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag size={18} /> Report Conversation
            </DialogTitle>
            <DialogDescription>
              Report inappropriate behavior, scam attempt, or safety concern to Hollis Support.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReport} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Reason for Report</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spam / Unsolicited messages">Spam / Unsolicited messages</SelectItem>
                  <SelectItem value="Fraud / Payment Off-Platform">Fraud / Payment Off-Platform</SelectItem>
                  <SelectItem value="Abusive or Offensive Language">Abusive or Offensive Language</SelectItem>
                  <SelectItem value="Safety Concern">Safety Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Additional Details (Optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any additional details or context…"
                className="h-24"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Submit Report
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
