import React from "react";

// ==================== DASHBOARD CARD ====================
interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColorClass?: string; // e.g. "text-primary bg-primary/10"
  size?: "small" | "large";
}

export const DashboardCard = ({
  label,
  value,
  icon: Icon,
  iconColorClass = "text-primary bg-primary/10",
  size = "large"
}: DashboardCardProps) => {
  if (size === "small") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground">
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 card-elevated">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColorClass}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== PROGRESS CATEGORY CHART ====================
interface ProgressCategoryData {
  label: string;
  value: number;
  colorClass?: string; // e.g. "bg-primary"
  icon?: React.ElementType;
}

interface ProgressCategoryChartProps {
  data: ProgressCategoryData[];
  valueFormatter?: (val: number) => string;
  total?: number;
}

export const ProgressCategoryChart = ({
  data,
  valueFormatter = (val) => String(val),
  total
}: ProgressCategoryChartProps) => {
  const sum = data.reduce((acc, d) => acc + d.value, 0);
  const denom = total ?? (sum > 0 ? sum : 1);

  return (
    <div className="space-y-3">
      {data.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-foreground">
                {Icon && <Icon size={12} />}
                {r.label}
              </span>
              <span className="font-semibold text-foreground">
                {valueFormatter(r.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-accent overflow-hidden">
              <div
                className={`h-full ${r.colorClass || "bg-primary"} transition-all duration-500`}
                style={{ width: `${(r.value / denom) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== VERTICAL BAR CHART ====================
interface BarChartData {
  label: string;
  value: number;
}

interface VerticalBarChartProps {
  data: BarChartData[];
  valueFormatter?: (val: number) => string;
  heightClass?: string;
  barColorClass?: string;
}

export const VerticalBarChart = ({
  data,
  valueFormatter = (val) => String(val),
  heightClass = "h-40",
  barColorClass = "bg-primary/80"
}: VerticalBarChartProps) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex items-stretch gap-2 ${heightClass}`}>
      {data.map((d) => {
        const percentage = (d.value / maxVal) * 100;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1 h-full">
            <span className="text-[10px] font-medium text-foreground">
              {valueFormatter(d.value)}
            </span>
            <div className="w-full flex-1 flex items-end justify-center min-h-[60px]">
              <div
                className={`w-full rounded-t ${barColorClass} transition-all duration-500`}
                style={{ height: `${percentage}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
