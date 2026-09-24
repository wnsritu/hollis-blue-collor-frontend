import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Briefcase,
  MessageSquare,
  CreditCard,
  FileText,
  Star,
  Trash2,
  BellRing,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/context/NotificationContext";
import { useAuthSession } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getNotificationIcon = (type?: string) => {
  const norm = String(type || "").toLowerCase();
  if (norm.includes("booking") || norm.includes("appointment")) {
    return { icon: Briefcase, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" };
  }
  if (norm.includes("message") || norm.includes("chat")) {
    return { icon: MessageSquare, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" };
  }
  if (norm.includes("payment")) {
    return { icon: CreditCard, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40" };
  }
  if (norm.includes("proposal") || norm.includes("quote") || norm.includes("lead")) {
    return { icon: FileText, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40" };
  }
  if (norm.includes("review")) {
    return { icon: Star, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40" };
  }
  if (norm.includes("dispute")) {
    return { icon: ShieldAlert, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40" };
  }
  return { icon: Bell, color: "text-primary bg-primary/10" };
};

export const NotificationBell: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuthSession();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    pushSupported,
    isPushSubscribed,
    enablePushNotifications,
    isPushLoading,
  } = useNotifications();

  const handleNotificationClick = (item: any) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    setOpen(false);

    const targetUrl = item.url || item.payload?.url || null;
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("relative shrink-0 transition-transform active:scale-95", className)}
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[400px] p-0 rounded-2xl shadow-2xl border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-semibold text-sm text-foreground">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[11px] h-5 px-1.5 font-medium">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <CheckCheck size={14} /> Mark all read
            </Button>
          )}
        </div>

        {/* Web Push Banner (if not already subscribed) */}
        {pushSupported && !isPushSubscribed && (
          <div className="px-4 py-2.5 bg-primary/5 border-b border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BellRing size={16} className="text-primary shrink-0 animate-pulse" />
              <p className="text-xs text-foreground font-medium leading-tight">
                Get notified when browser is closed
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              disabled={isPushLoading}
              onClick={() => enablePushNotifications()}
              className="h-7 text-xs rounded-full px-3 shrink-0"
            >
              {isPushLoading ? "Enabling..." : "Enable"}
            </Button>
          </div>
        )}

        {/* Notification List */}
        <ScrollArea className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <Bell size={22} className="opacity-50" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px]">
                We'll notify you here about bookings, messages, quotes, and updates.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const { icon: Icon, color } = getNotificationIcon(item.type);
              const isUnread = !item.is_read;

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "group flex items-start gap-3 p-3.5 hover:bg-muted/50 cursor-pointer transition-colors relative",
                    isUnread && "bg-primary/[0.03]"
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      color
                    )}
                  >
                    <Icon size={15} />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimeAgo(item.created_at || item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Actions / Unread marker */}
                  <div className="absolute right-3 top-3.5 flex items-center gap-1">
                    {isUnread && (
                      <span className="size-2 rounded-full bg-primary shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded transition-opacity"
                      aria-label="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/80 px-4 py-2.5 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {isPushSubscribed ? (
              <span className="inline-flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Push active
              </span>
            ) : (
              <span className="text-[11px]">Real-time connected</span>
            )}
          </span>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/admin/notifications");
              }}
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              All Notifications <ExternalLink size={11} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/dashboard");
              }}
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
