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
  service_location_address?: string;
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
    : rawServices.map((s: any) => (typeof s === "string" ? s : s?.name || String(s))).filter(Boolean);
  const initials = provider.initials || provider.name.slice(0, 2).toUpperCase();
  const ratingValue = Number(provider.rating) || 0;
  const reviewsCount = Number(provider.reviews) || 0;
  const hasReviews = reviewsCount > 0 && ratingValue > 0;

  const locationText =
    [provider.city, provider.state].filter(Boolean).join(", ") ||
    provider.service_location_address ||
    "Not specified";

  return (
    <div className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div>
        {/* Header: Avatar, Name, Badges, Category, Rating */}
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            initials={initials}
            src={provider.avatarUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-base font-bold text-foreground">
                {provider.name}
              </h3>
              {provider.verified && <VerifiedBadge compact />}
              {provider.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-soft-foreground">
                  <Sparkles size={12} className="text-accent" /> Featured
                </span>
              )}
            </div>

            {provider.category && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground font-normal">
                {provider.category}
              </p>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {hasReviews ? (
                <>
                  <Stars rating={ratingValue} size={13} />
                  <span className="font-semibold text-foreground">
                    {ratingValue.toFixed(1)}
                  </span>
                  <span>({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})</span>
                </>
              ) : (
                <>
                  <Stars rating={0} size={13} />
                  <span className="text-muted-foreground">No reviews yet</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tagline / Description snippet */}
        {!compact && provider.tagline && provider.tagline.trim() && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {provider.tagline}
          </p>
        )}

        {/* Service tags pills */}
        {list.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {list.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {s}
              </span>
            ))}
            {list.length > 3 && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                +{list.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* 2x2 Metadata Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Service area</dt>
            <dd className="truncate font-medium mt-0.5" title={locationText}>
              {locationText}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="font-medium mt-0.5">
              {provider.years != null && Number(provider.years) > 0
                ? `${provider.years} ${Number(provider.years) === 1 ? "year" : "years"}`
                : "Not specified"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Starting at</dt>
            <dd className="font-display font-bold text-primary mt-0.5">
              {provider.startingPrice != null && Number(provider.startingPrice) > 0
                ? usd(Number(provider.startingPrice))
                : "Custom quote"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Availability</dt>
            <dd className={`truncate font-medium mt-0.5 ${provider.availability ? "text-success" : "text-muted-foreground"}`}>
              {provider.availability || "Check schedule"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Button */}
      <div className="mt-5 flex gap-2">
        <Button
          asChild
          className="flex-1"
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
  id: string | number;
  status: string;
  serviceName: string;
  provider?: string;
  customer?: string;
  serviceDescription?: string;
  proposedPrice?: number | string;
  price?: number | string;
  kind?: string;
  requestKind?: string;
  date?: string;
  time?: string;
  address?: string;
  paymentStatus?: string;
  isPaid?: boolean;
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
  const isPriceUpdated = booking.status === "Price Updated" || booking.status === "price_updated";
  const displayPrice = booking.proposedPrice || booking.price || 0;
  const isFixed =
    booking.kind === "Standard" ||
    booking.requestKind === "Fixed Service" ||
    booking.kind === "fixed" ||
    booking.kind === "item_based" ||
    (!booking.kind && !booking.requestKind);

  const isPaid =
    booking.isPaid ||
    (booking.paymentStatus || "").toLowerCase() === "paid" ||
    (booking.paymentStatus || "").toLowerCase() === "succeeded" ||
    booking.status === "Completed" ||
    booking.status === "finished";

  const paymentText = isPaid
    ? "Payment: Paid"
    : (booking.paymentStatus || "").toLowerCase() === "escrow" || (booking.paymentStatus || "").toLowerCase() === "held"
    ? "Payment: Escrow Held"
    : "Payment: Pending";

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div>
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
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isPaid
                ? "bg-success-soft text-success border border-success/20"
                : "bg-amber-500/10 text-amber-700 border border-amber-200"
            }`}
          >
            {paymentText}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {typeof booking.id === "string" && booking.id.startsWith("BKG-") ? booking.id : `BKG-${booking.id}`}
          </span>
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
          {Number(displayPrice) > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Wallet size={14} /> {usd(displayPrice)}
            </span>
          )}
        </div>
        {booking.address && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={13} className="shrink-0" /> <span className="truncate">{booking.address}</span>
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {action ?? (
          <Button
            asChild
            variant={isPriceUpdated ? "default" : "outline"}
            size="sm"
            className="w-full justify-center text-xs"
          >
            {side === "customer" ? (
              <Link to={`/customer/bookings/${booking.id}`}>
                {isPriceUpdated ? "Review & Accept Price" : "View booking"}
              </Link>
            ) : (
              <Link to={`/provider/jobs`}>Manage</Link>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

