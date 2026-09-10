import React, { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";
import { getLoggedInHomeRedirect } from "@/utils/postLoginNavigation";
import type { StatusPillProps } from "@/types/status.types";
import {
  STATUS_TONE_STYLES,
  STATUS_TO_TONE_MAP,
  formatStatusDisplay,
} from "@/constants/status.constants";

export function Logo({
  className,
  imgClassName,
  overhanging = false,
  isAtTop = true,
  to,
}: {
  className?: string;
  imgClassName?: string;
  overhanging?: boolean;
  isAtTop?: boolean;
  to?: string;
}) {
  const { isAuthenticated, user } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());
  const isLoggedIn = isAuthenticated || hasToken;
  const destination = to || (isLoggedIn ? getLoggedInHomeRedirect(user) : "/");

  return (
    <Link
      to={destination}
      className={cn(
        "inline-flex items-center shrink-0 transition-all duration-300 hover:scale-[1.02]",
        overhanging && isAtTop && "relative z-30 mt-0 sm:mt-[0em]",
        overhanging && !isAtTop && "relative z-30 mt-0 sm:mt-[-2em]",
        className
      )}
    >
      {overhanging ? (
        <img
          src="/hollis-logo.png"
          alt="Hollis"
          className={cn(
            "w-auto transition-all duration-300 h-14 sm:h-[6rem]",
            isAtTop ? "mb-0 sm:mb-[-3rem]" : "mb-0 sm:mb-[-3rem]",
            imgClassName
          )}
        />
      ) : (
        <img
          src="/hollis-logo.png"
          alt="Hollis"
          className={cn("h-12 w-auto max-h-14 object-contain", imgClassName)}
        />
      )}
    </Link>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= Math.round(rating) ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
      <BadgeCheck size={13} />
      {!compact && "Verified"}
    </span>
  );
}

export function StatusPill({
  status,
  tone,
  className,
  showDot = true,
}: StatusPillProps) {
  const normKey = (status || "").toLowerCase().replace(/[-_\s]+/g, "");
  const resolvedTone = tone ?? STATUS_TO_TONE_MAP[normKey] ?? "neutral";
  const displayLabel = formatStatusDisplay(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        STATUS_TONE_STYLES[resolvedTone] || STATUS_TONE_STYLES.neutral,
        className,
      )}
    >
      {showDot && (
        <span className="size-1.5 rounded-full bg-current opacity-70 shrink-0" />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warning" | "accent";
}) {
  const tones = {
    brand: "bg-primary-soft text-primary-soft-foreground",
    success: "bg-success-soft text-success-soft-foreground",
    warning: "bg-warning-soft text-warning-soft-foreground",
    accent: "bg-accent-soft text-accent-soft-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-8 gap-4",
        center ? "text-center" : "grid grid-cols-[minmax(0,1fr)_auto] items-end sm:flex sm:justify-between",
      )}
    >
      <div className={cn("min-w-0", center && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

import { resolveMediaUrl } from "@/utils/mediaUrl";

export function Avatar({
  initials,
  src,
  image,
  size = "md",
  className,
}: {
  initials: string;
  src?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "size-9 text-xs", md: "size-12 text-sm", lg: "size-16 text-lg" };
  const targetSrc = src || image;
  const fullUrl = targetSrc ? resolveMediaUrl(targetSrc) : null;
  const [imgError, setImgError] = useState(false);

  if (fullUrl && !imgError) {
    return (
      <img
        src={fullUrl}
        alt={initials}
        onError={() => setImgError(true)}
        className={cn(
          "shrink-0 rounded-2xl object-cover border border-border shadow-xs",
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl bg-primary-soft font-display font-bold text-primary",
        sizes[size],
        className
      )}
    >
      {initials}
    </span>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-4">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-pulse duration-1000">
          <img
            src="/hollis-logo.png"
            alt="Loading..."
            className="h-32 sm:h-40 md:h-48 w-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
