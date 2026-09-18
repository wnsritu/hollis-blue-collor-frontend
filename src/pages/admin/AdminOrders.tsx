import { useState } from "react";
import { Briefcase, CalendarDays, Clock, FileText, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/primitives";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

const bookings = [
  {
    id: "BKG-20411",
    kind: "Standard",
    providerId: "summit-electric",
    provider: "Summit Electric",
    customerId: "cus_1001",
    customer: "Sarah Whitfield",
    serviceName: "Recessed Lighting (per fixture)",
    serviceDescription: "Install eight 6-inch LED recessed cans plus a dimmer switch.",
    price: 1480,
    date: "Sep 4, 2026",
    time: "1:00 PM",
    address: "2117 Ridgemont Dr, Austin, TX 78704",
    notes: "Attic access is through the hallway closet.",
    status: "Scheduled",
    paid: true,
    createdAt: "Aug 21, 2026",
  },
  {
    id: "BKG-20418",
    kind: "Standard",
    providerId: "abc-plumbing",
    provider: "ABC Plumbing Co.",
    customerId: "cus_1001",
    customer: "Sarah Whitfield",
    serviceName: "Water Heater Installation",
    serviceDescription: "Like-for-like 50 gallon gas replacement with haul-away.",
    price: 850,
    date: "Aug 26, 2026",
    time: "8:00 AM",
    address: "2117 Ridgemont Dr, Austin, TX 78704",
    notes: "Unit is in the garage, easy access.",
    status: "Requested",
    paid: false,
    createdAt: "Aug 25, 2026",
  },
  {
    id: "BKG-20402",
    kind: "Standard",
    providerId: "brighthome-cleaning",
    provider: "BrightHome Cleaning",
    customerId: "cus_1002",
    customer: "Marcus Bell",
    serviceName: "Deep Clean",
    serviceDescription: "1,850 sq ft home, kitchen and bathrooms prioritized.",
    price: 285,
    date: "Aug 12, 2026",
    time: "9:00 AM",
    address: "1420 W Wrightwood Ave, Chicago, IL 60614",
    notes: "One dog in the home.",
    status: "Reviewed",
    paid: true,
    createdAt: "Aug 5, 2026",
    reviewed: true,
  },
  {
    id: "BKG-20425",
    kind: "Standard",
    providerId: "abc-plumbing",
    provider: "ABC Plumbing Co.",
    customerId: "cus_1003",
    customer: "Priya Raman",
    serviceName: "Drain Cleaning & Hydro Jetting",
    serviceDescription: "Kitchen line backing up into the dishwasher.",
    price: 210,
    date: "Aug 27, 2026",
    time: "11:00 AM",
    address: "4402 N 44th St, Phoenix, AZ 85018",
    notes: "",
    status: "Paid",
    paid: true,
    createdAt: "Aug 24, 2026",
  },
  {
    id: "BKG-20388",
    kind: "Custom",
    providerId: "greenpro-landscaping",
    provider: "GreenPro Landscaping",
    customerId: "cus_1004",
    customer: "Daniel Ortiz",
    serviceName: "Custom — Paver patio with seating wall",
    serviceDescription: "400 sq ft paver patio, demo of existing slab, 18 ft seating wall.",
    price: 7240,
    date: "Sep 15, 2026",
    time: "7:30 AM",
    address: "915 Cleveland Ave, Charlotte, NC 28203",
    notes: "Gate access on the left side of the house.",
    status: "In Progress",
    paid: true,
    createdAt: "Aug 19, 2026",
    requestId: "CSR-6602",
  },
];

export const AdminOrders = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const list = bookings.filter(
    (b) =>
      `${b.serviceName} ${b.customer} ${b.provider} ${b.id}`.toLowerCase().includes(q.toLowerCase()) &&
      (status === "all" || b.status === status)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Bookings"
        subtitle={`${bookings.length} service bookings across the platform`}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search service name, customer or provider…"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {[
              "all",
              "Pending Acceptance",
              "Price Updated",
              "Confirmed",
              "Scheduled",
              "In Progress",
              "Completed",
              "Cancelled",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Briefcase}
              title="No service bookings found"
              description="No bookings match your current search or status filter."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service &amp; Booking ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((b) => {
                const isFixed = b.kind === "Standard" || b.requestKind === "Fixed Service";
                const displayPrice = b.proposedPrice || b.price;

                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <p className="font-bold text-foreground max-w-xs truncate">{b.serviceName}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{b.id}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                          isFixed
                            ? "bg-primary-soft text-primary"
                            : "bg-accent-soft text-accent-soft-foreground font-bold"
                        }`}
                      >
                        {isFixed ? <Tag size={12} /> : <FileText size={12} />}
                        {isFixed ? "Fixed Service" : "Request a Quote"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-xs whitespace-nowrap">{b.customer}</TableCell>
                    <TableCell className="font-medium text-xs whitespace-nowrap">{b.provider}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays size={13} /> {b.date}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                        <Clock size={12} /> {b.time}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm whitespace-nowrap">
                      {usd(displayPrice)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusPill status={b.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
