import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Bell,
  Briefcase,
  MessageSquare,
  CreditCard,
  FileText,
  Star,
  ShieldAlert,
  BellRing,
  Check,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

const typeIconMap: Record<string, any> = {
  booking: Briefcase,
  appointment: Briefcase,
  chat: MessageSquare,
  message: MessageSquare,
  payment: CreditCard,
  proposal: FileText,
  lead: FileText,
  quote: FileText,
  review: Star,
  dispute: ShieldAlert,
};

const resolveIcon = (type: string) => {
  const norm = String(type || "").toLowerCase();
  for (const [key, icon] of Object.entries(typeIconMap)) {
    if (norm.includes(key)) return icon;
  }
  return Bell;
};

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    pushSupported,
    isPushSubscribed,
    enablePushNotifications,
    isPushLoading,
  } = useNotifications();

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read
  );

  const handleRowClick = (item: any) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    const targetUrl = item.url || item.payload?.url;
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
        </div>

        <div className="flex items-center gap-2">
          {pushSupported && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPushSubscribed || isPushLoading}
              onClick={() => enablePushNotifications()}
              className="gap-1.5"
            >
              {isPushSubscribed ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span>Push Enabled</span>
                </>
              ) : (
                <>
                  <BellRing size={14} />
                  <span>{isPushLoading ? "Enabling..." : "Enable Push"}</span>
                </>
              )}
            </Button>
          )}

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "unread", "read"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Title & Message</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No notifications found in this view.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((n) => {
                  const Icon = resolveIcon(n.type);
                  const isUnread = !n.is_read;
                  return (
                    <TableRow
                      key={n.id}
                      onClick={() => handleRowClick(n)}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        isUnread ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <TableCell>
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon size={15} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-foreground">{n.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {n.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {n.created_at || n.createdAt
                          ? new Date(n.created_at || n.createdAt!).toLocaleString()
                          : "Recent"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={n.is_read ? "outline" : "default"}
                          className="text-xs"
                        >
                          {n.is_read ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
