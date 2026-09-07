import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Stars, StatusPill, VerifiedBadge } from "@/components/shared/primitives";

export function usd(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

export interface GenericProvider {
  id: string;
  name: string;
  avatarUrl?: string | null;
  initials?: string;
  verified?: boolean;
  featured?: boolean;
  category?: string;
  rating?: number;
  reviews?: number;
  tagline?: string;
  services?: (string | { name: string })[];
  city?: string;
  state?: string;
  years?: number;
  startingPrice?: number;
  availability?: string;
}

export function ProviderCard({
  provider,
  compact = false,
  services = [],
}: {
  provider: GenericProvider;
  compact?: boolean;
  services?: string[];
}) {
  let rawServices: any = provider.services || [];
  if (typeof rawServices === "string") {
    try {
      const parsed = JSON.parse(rawServices);
      rawServices = Array.isArray(parsed) ? parsed : [rawServices];
    } catch {
      rawServices = [rawServices];
    }
  }
  if (!Array.isArray(rawServices)) {
    rawServices = [];
  }

  const list = services.length
    ? services
    : rawServices.map((s: any) => (typeof s === "string" ? s : s?.name || String(s)));
  const initials = provider.initials || provider.name.slice(0, 2).toUpperCase();
  const ratingValue = Number(provider.rating) > 0 ? Number(provider.rating) : 4.9;
  const reviewsCount = provider.reviews !== undefined ? provider.reviews : 12;

  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div>
        {/* Header: Avatar, Name, Badges, Category, Rating */}
        <div className="flex min-w-0 items-start gap-3.5">
          <Avatar
            initials={initials}
            src={provider.avatarUrl}
            className="w-12 h-12 rounded-full font-bold text-sm bg-blue-50 text-blue-800 border-none shadow-none shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="truncate font-display text-base font-bold text-foreground">
                {provider.name}
              </h3>
              {provider.verified && <VerifiedBadge compact />}
              {provider.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fef2f2] text-[#f43f5e] border border-[#fecdd3] px-2.5 py-0.5 text-xs font-semibold shrink-0">
                  <Sparkles size={11} className="text-[#f43f5e] fill-[#f43f5e]" /> Featured
                </span>
              )}
            </div>

            {provider.category && (
              <p className="mt-0.5 truncate text-xs sm:text-sm text-muted-foreground font-normal">
                {provider.category}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5 text-[#dc2626]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-[#dc2626] leading-none text-sm">★</span>
                ))}
              </div>
              <span className="font-bold text-foreground ml-0.5">
                {ratingValue.toFixed(1)}
              </span>
              <span>({reviewsCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Tagline / Description snippet */}
        {!compact && provider.tagline && (
          <p className="mt-3 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {provider.tagline}
          </p>
        )}

        {/* Service tags pills */}
        {list.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {list.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted/80 text-foreground/80 hover:bg-muted px-3 py-1 text-xs font-medium transition-colors"
              >
                {s}
              </span>
            ))}
            {list.length > 3 && (
              <span className="rounded-full bg-muted/80 text-muted-foreground px-2.5 py-1 text-xs font-medium">
                +{list.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* 2x2 Metadata Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-border/60 text-xs">
          <div className="min-w-0">
            <dt className="text-muted-foreground">Service area</dt>
            <dd className="truncate font-bold text-sm text-foreground mt-0.5">
              {[provider.city, provider.state].filter(Boolean).join(", ") || "USA, Florida"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">Experience</dt>
            <dd className="font-bold text-sm text-foreground mt-0.5">
              {provider.years != null && provider.years > 0 ? `${provider.years} years` : "0 years"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">Starting at</dt>
            <dd className="font-bold text-sm text-foreground mt-0.5">
              {provider.startingPrice != null ? usd(provider.startingPrice) : "$75.00"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground">Availability</dt>
            <dd className="truncate font-semibold text-sm text-emerald-600 mt-0.5">
              {provider.availability || "Available Today"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Button */}
      <div className="mt-5">
        <Button
          asChild
          className="w-full bg-[#0a1e3a] hover:bg-[#122b52] text-white rounded-xl py-2.5 font-semibold text-sm shadow-xs transition-colors"
        >
          <Link to={`/provider/${provider.id}`}>
            View Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

export interface GenericBooking {
  id: string;
  status: string;
  serviceName: string;
  provider?: string;
  customer?: string;
  serviceDescription?: string;
  proposedPrice?: number;
  price?: number;
  kind?: string;
  requestKind?: string;
  date?: string;
  time?: string;
  address?: string;
}

export function BookingCard({
  booking,
  side = "customer",
  action,
}: {
  booking: GenericBooking;
  side?: "customer" | "provider";
  action?: React.ReactNode;
}) {
  const isPriceUpdated = booking.status === "Price Updated";
  const displayPrice = booking.proposedPrice || booking.price || 0;
  const isFixed = booking.kind === "Standard" || booking.requestKind === "Fixed Service";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isFixed
              ? "bg-primary-soft text-primary"
              : "bg-accent-soft text-accent-soft-foreground font-bold"
          }`}
        >
          {isFixed ? "Fixed Service" : "Request a Quote"}
        </span>
        <StatusPill status={booking.status} />
        <span className="ml-auto text-xs text-muted-foreground">{booking.id}</span>
      </div>

      <h3 className="mt-3 font-display text-base font-bold leading-snug">{booking.serviceName}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {side === "customer" ? booking.provider : booking.customer}
      </p>
      {booking.serviceDescription && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{booking.serviceDescription}</p>
      )}

      {isPriceUpdated && (
        <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-300 p-2.5 text-xs text-amber-900">
          <p className="font-bold">Provider updated price to {usd(displayPrice)}</p>
          <p className="text-[11px] opacity-80">Awaiting your approval</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {booking.date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} /> {booking.date}
          </span>
        )}
        {booking.time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {booking.time}
          </span>
        )}
        {displayPrice > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Wallet size={14} /> {usd(displayPrice)}
          </span>
        )}
      </div>
      {booking.address && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={13} /> {booking.address}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {action ?? (
          <Button
            asChild
            variant={isPriceUpdated ? "default" : "outline"}
            size="sm"
            className="w-full justify-center text-xs"
          >
            {side === "customer" ? (
              <Link to={`/order/${booking.id}`}>
                {isPriceUpdated ? "Review & Accept Price" : "View order"}
              </Link>
            ) : (
              <Link to={`/provider/order/${booking.id}`}>Manage</Link>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
