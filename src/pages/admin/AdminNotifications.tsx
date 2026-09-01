import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, ShoppingCart, Users, AlertTriangle } from "lucide-react";

export const mockNotifications = [
  { id: "1", type: "Order" as const, message: "New order ORD-206 placed by Alex Johnson", date: "2026-03-18 10:30 AM", read: false },
  { id: "2", type: "Provider" as const, message: "New provider 'Crystal Clean Co.' signed up", date: "2026-03-18 09:15 AM", read: false },
  { id: "3", type: "Dispute" as const, message: "Dispute raised for order ORD-204", date: "2026-03-17 04:45 PM", read: false },
  { id: "4", type: "Order" as const, message: "Order ORD-205 completed successfully", date: "2026-03-17 02:30 PM", read: true },
  { id: "5", type: "Provider" as const, message: "Provider 'Fresh & Clean Co.' updated profile", date: "2026-03-17 11:00 AM", read: true },
  { id: "6", type: "Dispute" as const, message: "Dispute DSP-002 resolved", date: "2026-03-16 03:00 PM", read: true },
  { id: "7", type: "Order" as const, message: "Order ORD-203 payment confirmed", date: "2026-03-16 10:00 AM", read: true },
];

const typeIcon = { Order: ShoppingCart, Provider: Users, Dispute: AlertTriangle };
const typeColor = { Order: "bg-primary/10 text-primary", Provider: "bg-secondary/10 text-secondary", Dispute: "bg-destructive/10 text-destructive" };

const AdminNotifications = () => {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [notifications, setNotifications] = useState(mockNotifications);

  const filtered = notifications.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.read : n.read
  );

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
      </div>

      <div className="flex gap-2">
        {(["all", "unread", "read"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((n) => {
                const Icon = typeIcon[n.type];
                return (
                  <TableRow key={n.id} className={!n.read ? "bg-primary/5" : ""}>
                    <TableCell>
                      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${typeColor[n.type]}`}>
                        <Icon size={14} />
                      </div>
                    </TableCell>
                    <TableCell className={`${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.message}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{n.date}</TableCell>
                    <TableCell>
                      <Badge variant={n.read ? "outline" : "default"} className="text-xs">
                        {n.read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
