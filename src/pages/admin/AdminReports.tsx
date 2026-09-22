import { useEffect, useState } from "react";
import { Download, Percent, Receipt, TrendingUp, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatCard } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { adminApi } from "@/services/admin";
import { getErrorMessage } from "@/lib/api/errors";

interface TopProvider {
  id?: number;
  name: string;
  jobs: number;
  volume: number;
  rating: number;
}

interface CategoryPerformance {
  id?: number;
  name: string;
  openJobs: number;
  pros: number;
}

interface ReportData {
  range: string;
  commissionRate: number;
  gross: number;
  commission: number;
  avgJobValue: number;
  activeProviders: number;
  byProvider: TopProvider[];
  categories: CategoryPerformance[];
}

export function AdminReports() {
  const [range, setRange] = useState("7m");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    range: "7m",
    commissionRate: 0,
    gross: 0,
    commission: 0,
    avgJobValue: 0,
    activeProviders: 0,
    byProvider: [],
    categories: [],
  });

  const fetchReports = async (selectedRange: string) => {
    try {
      setLoading(true);
      const res: any = await adminApi.getReports({ range: selectedRange });
      const data = res?.data?.data || res?.data || res;
      if (data) {
        setReportData({
          range: data.range || selectedRange,
          commissionRate: Number(data.commissionRate) || 15,
          gross: Number(data.gross) || 0,
          commission: Number(data.commission) || 0,
          avgJobValue: Number(data.avgJobValue) || 0,
          activeProviders: Number(data.activeProviders) || 0,
          byProvider: Array.isArray(data.byProvider) ? data.byProvider : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
        });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load report analytics"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports(range);
  }, [range]);

  const handleExportCSV = () => {
    try {
      const rows: string[][] = [];

      // Summary Section
      rows.push(["MARKETPLACE ANALYTICS REPORT"]);
      rows.push(["Date Range", range.toUpperCase()]);
      rows.push(["Generated At", new Date().toLocaleString()]);
      rows.push([]);
      rows.push(["METRIC", "VALUE"]);
      rows.push(["Gross Volume", `$${reportData.gross.toFixed(2)}`]);
      rows.push(["Commission Rate", `${reportData.commissionRate}%`]);
      rows.push(["Commission Revenue", `$${reportData.commission.toFixed(2)}`]);
      rows.push(["Average Job Value", `$${reportData.avgJobValue.toFixed(2)}`]);
      rows.push(["Active Providers", String(reportData.activeProviders)]);
      rows.push([]);

      // Top Providers Section
      rows.push(["TOP PROVIDERS BY VOLUME"]);
      rows.push(["Provider Name", "Completed Jobs", "Volume ($)", "Rating"]);
      if (reportData.byProvider.length > 0) {
        reportData.byProvider.forEach((p) => {
          rows.push([
            `"${(p.name || "Unknown").replace(/"/g, '""')}"`,
            String(p.jobs),
            `$${Number(p.volume || 0).toFixed(2)}`,
            `${p.rating} ★`,
          ]);
        });
      } else {
        rows.push(["No provider records found for this period", "", "", ""]);
      }
      rows.push([]);

      // Category Performance Section
      rows.push(["CATEGORY PERFORMANCE"]);
      rows.push(["Category / Service", "Open Jobs", "Active Providers"]);
      if (reportData.categories.length > 0) {
        reportData.categories.forEach((c) => {
          rows.push([
            `"${(c.name || "Unknown").replace(/"/g, '""')}"`,
            String(c.openJobs),
            String(c.pros),
          ]);
        });
      } else {
        rows.push(["No category records found", "", ""]);
      }

      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `marketplace-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV Report Downloaded", {
        description: `Exported ${range.toUpperCase()} marketplace report successfully.`,
      });
    } catch {
      toast.error("Failed to export report CSV");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Marketplace analytics overview"
        action={
          <div className="flex items-center gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="7m">Last 7 months</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={loading}
              className="gap-2"
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross Volume"
          value={loading ? "..." : usd(reportData.gross)}
          hint="Paid transactions"
          icon={Receipt}
        />
        <StatCard
          label="Commission"
          value={loading ? "..." : usd(reportData.commission)}
          hint={`${reportData.commissionRate}% platform take rate`}
          icon={Percent}
          tone="accent"
        />
        <StatCard
          label="Avg. Job Value"
          value={loading ? "..." : usd(reportData.avgJobValue)}
          hint="Per completed service"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Active Providers"
          value={loading ? "..." : reportData.activeProviders}
          hint="Providers active in period"
          icon={Users}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading report analytics...</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Top Providers Table */}
          <section className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Top Providers by Volume</h2>
              <span className="text-xs text-muted-foreground">
                {reportData.byProvider.length} providers with activity
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.byProvider.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No provider transactions recorded for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.byProvider.map((p, idx) => (
                    <TableRow key={p.id ? `p-${p.id}` : `p-${idx}`}>
                      <TableCell className="font-semibold text-foreground">{p.name}</TableCell>
                      <TableCell className="text-right font-medium">{p.jobs}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {usd(p.volume)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.rating ? `${p.rating} ★` : "New"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>

          {/* Category Performance Table */}
          <section className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Category Performance</h2>
              <span className="text-xs text-muted-foreground">
                {reportData.categories.length} service categories
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Open Jobs</TableHead>
                  <TableHead className="text-right">Active Pros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      No category data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.categories.map((c, idx) => (
                    <TableRow key={c.id ? `c-${c.id}` : `c-${idx}`}>
                      <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                      <TableCell className="text-right font-medium">{c.openJobs}</TableCell>
                      <TableCell className="text-right font-bold">{c.pros}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
