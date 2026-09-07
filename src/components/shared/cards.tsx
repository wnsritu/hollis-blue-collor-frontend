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
  const rawServices = provider.services || [];
  const list = services.length
    ? services
    : rawServices.map((s) => (typeof s === "string" ? s : s.name));
  const initials = provider.initials || provider.name.slice(0, 2).toUpperCase();

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar initials={initials} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-base font-bold">{provider.name}</h3>
            {provider.verified && <VerifiedBadge compact />}
            {provider.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-soft-foreground">
                <Sparkles size={12} className="text-accent" /> Featured
              </span>
            )}
          </div>
          {provider.category && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{provider.category}</p>
          )}
          {provider.rating !== undefined && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Stars rating={provider.rating} size={13} />
              <span className="font-semibold text-foreground">{provider.rating.toFixed(1)}</span>
              {provider.reviews !== undefined && <span>({provider.reviews} reviews)</span>}
            </div>
          )}
        </div>
      </div>

      {!compact && provider.tagline && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{provider.tagline}</p>
      )}

      {list.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {list.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
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

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {(provider.city || provider.state) && (
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Service area</dt>
            <dd className="truncate font-medium">
              {[provider.city, provider.state].filter(Boolean).join(", ")}
            </dd>
          </div>
        )}
        {provider.years !== undefined && (
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="font-medium">{provider.years} years</dd>
          </div>
        )}
        {provider.startingPrice !== undefined && (
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Starting at</dt>
            <dd className="font-display font-bold text-primary">{usd(provider.startingPrice)}</dd>
          </div>
        )}
        {provider.availability && (
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Availability</dt>
            <dd className="truncate font-medium text-success">{provider.availability}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5 flex gap-2">
        <Button asChild className="flex-1">
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
