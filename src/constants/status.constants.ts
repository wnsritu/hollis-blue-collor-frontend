import type { StatusTone } from "@/types/status.types";

export const STATUS_TONE_STYLES: Record<StatusTone, string> = {
  neutral:
    "bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  brand:
    "bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  warning:
    "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  danger:
    "bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  purple:
    "bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
  indigo:
    "bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
  teal:
    "bg-teal-50 text-teal-700 border border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
  cyan:
    "bg-cyan-50 text-cyan-700 border border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60",
  accent:
    "bg-accent-soft text-accent-soft-foreground border border-accent/20 font-bold",
};

export const STATUS_TO_TONE_MAP: Record<string, StatusTone> = {
  // Green - Success / Completed
  completed: "success",
  finished: "success",
  delivered: "success",
  paid: "success",
  active: "success",
  confirmed: "success",
  accepted: "success",
  approved: "success",
  published: "success",
  provided: "success",
  workcompleted: "success",
  verified: "success",

  // Purple - Matching / AI leads
  matching: "purple",
  matched: "purple",
  lead: "purple",

  // Brand Blue - Proposals & Quotes & Open
  proposalsreceived: "brand",
  quotereceived: "brand",
  open: "brand",
  thisweek: "brand",

  // Amber - Warnings, Requests & Pendings
  pending: "warning",
  requested: "warning",
  pendingreview: "warning",
  pendingacceptance: "warning",
  quotepending: "warning",
  paymentpending: "warning",
  priceupdated: "warning",
  rescheduled: "warning",
  changesrequested: "warning",
  within48hours: "warning",
  inactive: "warning",

  // Indigo / Transit
  inprogress: "indigo",
  inprocess: "indigo",
  progress: "indigo",
  enroute: "indigo",

  // Teal - Arrival
  arrived: "teal",

  // Cyan - Scheduled
  scheduled: "cyan",

  // Red - Danger / Cancellations / Errors
  failed: "danger",
  cancelled: "danger",
  canceled: "danger",
  declined: "danger",
  rejected: "danger",
  suspended: "danger",
  noshow: "danger",
  emergency: "danger",

  // Neutral
  draft: "neutral",
  notprovided: "neutral",
  hidden: "neutral",
  expired: "neutral",
  flexible: "neutral",
};

export const formatStatusDisplay = (status?: string): string => {
  if (!status) return "";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b([a-z])/g, (_, char) => char.toUpperCase())
    .trim();
};

export const CUSTOM_REQUEST_TIMELINE_STEPS = [
  "Request Sent",
  "Quote Pending",
  "Quote Received",
  "Accepted",
  "Scheduled",
  "In Progress",
  "Completed",
] as const;
