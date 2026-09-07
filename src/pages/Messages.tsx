import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Send,
  Paperclip,
  ShieldAlert,
  UserX,
  Loader2,
  MessageSquare,
  FileQuestion,
  Check,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomerPortal, ProviderPortal, RolePortal } from "@/components/layout/portals";
import { EmptyState } from "@/components/shared/primitives";
import { chatApi } from "@/api/modules/chat.api";
import { useAuthSession } from "@/hooks/useAuth";
import { isCustomer, isProvider } from "@/constants/roles";
import type { ChatMessage, ChatThread } from "@/types/api/misc";
import toast from "react-hot-toast";

export const Messages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthSession();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userIsCustomer = isCustomer(user?.role_id);
  const userIsProvider = isProvider(user?.role_id);

  // Fetch conversations list
  const fetchThreads = async () => {
    setLoadingThreads(true);
    try {
      const res = await chatApi.listUserChats();
      const list = (res as any)?.data || res || [];
      const validThreads = Array.isArray(list) ? list : [];
      setThreads(validThreads);

      // Select thread from navigation state if available
      const stateSelectedId = (location.state as any)?.selectedChatId;
      if (stateSelectedId) {
        setActiveThreadId(stateSelectedId);
      } else if (validThreads.length > 0 && !activeThreadId) {
        setActiveThreadId(validThreads[0].id || validThreads[0].chat_id);
      }
    } catch (err) {
      console.error("Failed to load chat threads", err);
      toast.error("Failed to load conversations.");
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // Fetch messages for active thread
  useEffect(() => {
    if (!activeThreadId) return;
    let cancelled = false;

    (async () => {
      setLoadingMessages(true);
      try {
        const res = await chatApi.getMessages(activeThreadId);
        const list = (res as any)?.data || res || [];
        if (!cancelled) {
          setMessages(Array.isArray(list) ? list : []);
          // Mark read
          try {
            await chatApi.markAsRead({ chat_id: activeThreadId });
          } catch (mErr) {}
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeThreadId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await chatApi.sendMessage({
        chatId: activeThreadId,
        message: textToSend,
        sender_role: userIsCustomer ? "customer" : "provider",
      });
      const newMsg = (res as any)?.data || res;
      setMessages((prev) => [...prev, newMsg]);
      fetchThreads(); // Refresh thread last message snippet
    } catch (err: any) {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleReportChat = async () => {
    if (!activeThreadId) return;
    try {
      await chatApi.report(activeThreadId, { reason: reportReason });
      toast.success("Conversation reported to platform support.");
      setReportModalOpen(false);
      setReportReason("");
    } catch (err) {
      toast.error("Failed to submit report.");
    }
  };

  const handleBlockUser = async () => {
    if (!activeThreadId) return;
    if (!window.confirm("Are you sure you want to block this user?")) return;
    try {
      await chatApi.block(activeThreadId);
      toast.success("User blocked.");
      fetchThreads();
    } catch (err) {
      toast.error("Failed to block user.");
    }
  };

  const activeThread = threads.find(
    (t) => String(t.id || t.chat_id) === String(activeThreadId)
  );

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold">Project Messaging & Support</h1>
        <p className="text-sm text-muted-foreground">
          Communicate directly with your project customer/provider regarding quotes, scheduling, and updates.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[300px_1fr] min-h-[600px]">
        {/* Sidebar: Thread List */}
        <div className="border-r border-border p-4">
          <h3 className="font-display font-bold text-sm mb-3">Conversations</h3>
          {loadingThreads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <MessageSquare size={24} className="mx-auto text-muted-foreground/60 mb-2" />
              No active conversations yet.
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-[520px]">
              {threads.map((t) => {
                const threadId = t.id || t.chat_id;
                const isActive = String(threadId) === String(activeThreadId);
                const title = t.project?.title || t.other_user?.full_name || `Chat #${threadId}`;

                return (
                  <button
                    key={threadId}
                    onClick={() => setActiveThreadId(threadId)}
                    className={`w-full rounded-xl p-3 text-left transition-all ${
                      isActive
                        ? "bg-primary-soft/80 text-primary font-semibold"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="truncate font-bold">{title}</span>
                      {t.updatedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {t.last_message || "Start messaging..."}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Thread View */}
        <div className="flex flex-col h-full min-h-[550px]">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
                <div>
                  <h3 className="font-display font-bold text-base">
                    {activeThread.project?.title || activeThread.other_user?.full_name || "Project Chat"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Project #{activeThread.project_id || "Direct"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReportModalOpen(true)}
                    className="text-xs gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <ShieldAlert size={14} /> Report
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBlockUser}
                    className="text-xs gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <UserX size={14} /> Block
                  </Button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10 max-h-[420px]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    Send a message to introduce yourself and discuss project details.
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMine =
                      Number(m.sender_id) === Number(user?.id) ||
                      m.sender_role === (userIsCustomer ? "customer" : "provider");

                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-card border border-border text-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                          {m.attachment_url && (
                            <img
                              src={m.attachment_url}
                              alt="Attachment"
                              className="mt-2 rounded-lg max-h-48 object-cover"
                            />
                          )}
                        </div>
                        <span className="mt-1 text-[10px] text-muted-foreground px-1">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 p-3 border-t border-border bg-card"
              >
                <Input
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button type="submit" size="sm" disabled={sending || !inputText.trim()}>
                  {sending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground">
              <MessageSquare size={36} className="text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold">Select a conversation</p>
              <p className="text-xs">Choose a chat thread from the left to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              Report Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Reason for reporting (e.g. inappropriate language, fraud)..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReportChat} variant="destructive">
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
