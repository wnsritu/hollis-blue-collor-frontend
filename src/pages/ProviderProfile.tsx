import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Loader2,
  FileText,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, Stars, VerifiedBadge } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { CreateProjectModal } from "@/components/m3/CreateProjectModal";
import { providerApi } from "@/api/modules/provider.api";
import toast from "react-hot-toast";

export const ProviderProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await providerApi.getMarketplaceById(id);
        const data = (res as any)?.data || res;
        if (!cancelled) {
          setProvider(data);
        }
      } catch (err) {
        console.error("Failed to load provider profile", err);
        try {
          const legRes = await providerApi.getById(id);
          const legData = (legRes as any)?.data || legRes;
          if (!cancelled) setProvider(legData);
        } catch (legErr) {
          toast.error("Failed to load provider profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={36} className="animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading professional profile...</p>
      </div>
    );
  }

  // Parse basic provider attributes
  const name = provider?.business_name || provider?.user?.full_name || "Service Professional";
  const avatarPhoto = provider?.user?.profile_image || provider?.profile_photo || provider?.profile_image || null;
  const initials = name.slice(0, 2).toUpperCase();
  const verified = provider?.verified === "verified" || provider?.status === "active";
  const featured = Boolean(provider?.is_featured || provider?.featured);
  const tagline = provider?.service_description || "";
  const about = provider?.service_description || "No business description provided yet.";
  const rating = Number(provider?.rating) || 0;
  const city = provider?.city || "";
  const state = provider?.state || "";
  const country = provider?.country || "";
  const zip = provider?.zip_code || "";
  const locationParts = [city, state, country].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : "Location not specified";
  const years = Number(provider?.years_of_experience ?? provider?.experience ?? 0);
  const website = provider?.website || null;

  const mainCategoryName = provider?.category?.name || "Services";
  const subCategoryName =
    provider?.sub_category?.name ||
    provider?.category?.service_types?.[0]?.name ||
    (Array.isArray(provider?.service_categories) && provider.service_categories[0]) ||
    "";

  // Parse offered_services safely (handles JSON string from MySQL)
  let offeredNames: string[] = [];
  try {
    const rawOffered = provider?.offered_services || provider?.selected_services || provider?.services;
    if (typeof rawOffered === "string") {
      offeredNames = JSON.parse(rawOffered);
    } else if (Array.isArray(rawOffered)) {
      offeredNames = rawOffered;
    }
  } catch (e) {
    offeredNames = [];
  }

  // Parse service_pricing safely (handles JSON string from MySQL)
  let pricingMap: Record<string, { price: number; offered: boolean; unit: string }> = {};
  try {
    const rawPricing = provider?.service_pricing || provider?.pricing;
    if (typeof rawPricing === "string") {
      pricingMap = JSON.parse(rawPricing);
    } else if (typeof rawPricing === "object" && rawPricing !== null) {
      pricingMap = rawPricing;
    }
  } catch (e) {
    pricingMap = {};
  }

  // Construct dynamic servicesList from parsed data
  const servicesList: Array<{ name: string; price: number; unit: string }> = [];

  if (Array.isArray(offeredNames) && offeredNames.length > 0) {
    offeredNames.forEach((sItem: any) => {
      const sName = typeof sItem === "string" ? sItem : sItem.name || String(sItem);
      const config = pricingMap[sName] || pricingMap[String(sItem.id || "")];
      const price = config?.price !== undefined ? Number(config.price) : Number(sItem.price || sItem.amount || 0);
      const unit = config?.unit || "flat rate";
      const offered = config?.offered !== undefined ? Boolean(config.offered) : true;
      if (offered) {
        servicesList.push({ name: sName, price, unit });
      }
    });
  } else if (Object.keys(pricingMap).length > 0) {
    Object.entries(pricingMap).forEach(([sName, cfg]) => {
      if (cfg && cfg.offered !== false) {
        servicesList.push({
          name: sName,
          price: Number(cfg.price || 0),
          unit: cfg.unit || "flat rate",
        });
      }
    });
  }

  // Compute dynamic starting price
  const validPrices = servicesList.map((s) => s.price).filter((p) => p > 0);
  const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : Number(provider?.starting_price) || 0;

  // Parse Certifications dynamically
  let certsList: string[] = [];
  if (provider?.certifications) {
    try {
      const parsedCerts = typeof provider.certifications === "string" ? JSON.parse(provider.certifications) : provider.certifications;
      if (Array.isArray(parsedCerts)) {
        certsList = parsedCerts.map((c: any) => (typeof c === "string" ? c : c.name || String(c))).filter(Boolean);
      }
    } catch (e) {}
  }

  // Parse FAQs dynamically
  let faqsList: Array<{ question: string; answer: string }> = [];
  if (provider?.faqs) {
    try {
      const parsedFaqs = typeof provider.faqs === "string" ? JSON.parse(provider.faqs) : provider.faqs;
      if (Array.isArray(parsedFaqs)) {
        faqsList = parsedFaqs.filter((f: any) => f && f.question && f.answer);
      }
    } catch (e) {}
  }

  // Parse Portfolio dynamically
  let portfolioList: Array<{ url: string; caption?: string }> = [];
  if (provider?.portfolio) {
    try {
      const parsedPort = typeof provider.portfolio === "string" ? JSON.parse(provider.portfolio) : provider.portfolio;
      if (Array.isArray(parsedPort)) {
        portfolioList = parsedPort.filter((p: any) => p && p.url);
      }
    } catch (e) {}
  }

  // Parse Reviews dynamically from API
  const reviewsList: any[] = Array.isArray(provider?.reviews) ? provider.reviews : [];
  const reviewsCount = Number(provider?.review_count ?? provider?.reviews_count ?? reviewsList.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Banner */}
      <section className="border-b border-border bg-muted/20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} /> Back to search
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar initials={initials} src={avatarPhoto} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold sm:text-3xl font-display">{name}</h1>
                  {verified && <VerifiedBadge />}
                  {featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-soft-foreground">
                      <Sparkles size={12} className="text-accent" /> Featured
                    </span>
                  )}
                  {subCategoryName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                      {mainCategoryName} • {subCategoryName}
                    </span>
                  )}
                </div>

                {tagline && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tagline}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold">
                    <Stars rating={rating} />
                    <span>{rating.toFixed(1)}</span>
                    <span className="font-normal text-muted-foreground">({reviewsCount} reviews)</span>
                  </span>

                  {locationText && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-primary" /> {locationText} {zip && `(${zip})`}
                    </span>
                  )}

                  {years > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Award size={14} /> {years} years in business
                    </span>
                  )}

                  {website && (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Globe size={14} /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                      <MessageSquare size={16} /> Message
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Direct messaging is enabled upon quote or booking
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button size="lg" onClick={() => setQuoteModalOpen(true)} className="gap-2 shadow-sm">
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="container max-w-7xl mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left Column */}
        <div className="min-w-0 space-y-6">
          {/* About This Business */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-3">About this business</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {about}
            </p>
          </div>

          {/* Dynamic Services Offered */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Services offered</h2>
              <span className="text-xs font-semibold rounded-full bg-primary/10 text-primary px-3 py-1">
                {servicesList.length} services available
              </span>
            </div>

            {servicesList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No specific services configured by this provider yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {servicesList.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border p-4 bg-muted/20 hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.price > 0 ? (
                          <>
                            Rate: <span className="font-bold text-primary">{usd(s.price)}</span> /{s.unit}
                          </>
                        ) : (
                          <span className="font-semibold text-foreground">Contact for quote</span>
                        )}
                      </p>
                    </div>
                    <span className="size-2 rounded-full bg-success shrink-0" title="Available" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications (Rendered only if provider has certifications) */}
          {certsList.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="text-primary" size={20} /> Certifications & Licenses
              </h2>
              <div className="flex flex-wrap gap-2">
                {certsList.map((cert, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary-soft/30 px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    <CheckCircle2 size={14} className="text-primary" /> {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio (Rendered only if provider has portfolio images) */}
          {portfolioList.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold mb-4">Portfolio</h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                {portfolioList.map((item, idx) => (
                  <div key={idx} className="group overflow-hidden rounded-xl border border-border bg-muted/30 relative">
                    <img
                      src={item.url}
                      alt={item.caption || `Portfolio item ${idx + 1}`}
                      className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {item.caption && (
                      <p className="p-2 text-xs font-medium text-foreground truncate bg-card/90">
                        {item.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frequently Asked Questions (Rendered only if provider has FAQs) */}
          {faqsList.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqsList.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-border bg-muted/20 p-4 text-sm transition-colors hover:border-primary/30"
                    open={i === 0}
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground list-none focus:outline-none">
                      <span className="flex items-center gap-2">
                        <HelpCircle size={16} className="text-primary shrink-0" />
                        {faq.question}
                      </span>
                      <ChevronDown size={16} className="text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
                    </summary>
                    <p className="mt-3 pl-6 text-xs leading-relaxed text-muted-foreground border-t border-border/50 pt-2.5">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Reviews ({reviewsCount})</h2>

            {reviewsList.length > 0 ? (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl bg-muted/40 p-5">
                  <div>
                    <p className="font-display text-4xl font-extrabold">{rating.toFixed(1)}</p>
                    <Stars rating={rating} />
                  </div>
                </div>

                <div className="space-y-4">
                  {reviewsList.map((r, idx) => (
                    <div key={r.id || idx} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{r.customer_name || r.user?.full_name || "Customer"}</span>
                        <span className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</span>
                      </div>
                      <div className="mt-1">
                        <Stars rating={Number(r.rating) || 5} size={13} />
                      </div>
                      {r.title && <p className="mt-2 font-medium text-xs text-foreground">{r.title}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{r.comment || r.body || r.review}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No customer reviews posted yet for this professional.
              </p>
            )}
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <aside className="h-max space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs text-muted-foreground">Starting rate</p>
            <p className="font-display text-3xl font-extrabold text-primary">
              {startingPrice > 0 ? usd(startingPrice) : "Custom Quote"}
            </p>

            <div className="mt-5">
              <Button size="lg" className="w-full shadow-sm" onClick={() => setQuoteModalOpen(true)}>
                Request a Quote
              </Button>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-muted-foreground border-t border-border pt-5">
              {verified && (
                <li className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-success shrink-0" />
                  <span>License &amp; verification approved</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <span>Background checked</span>
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary shrink-0" />
                <span>Upfront transparent estimates</span>
              </li>
            </ul>
          </div>
        </aside>
      </section>

      {/* Quote / Job Request Modal */}
      <CreateProjectModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        initialCategoryId={provider?.category_id}
        initialServiceTypeId={provider?.service_type_id || provider?.sub_category?.id || provider?.category?.service_types?.[0]?.id}
        providerId={provider?.id}
        providerName={name}
        categoryName={mainCategoryName}
        subCategoryName={subCategoryName}
        onProjectCreated={() => {
          toast.success("Quote request submitted! The professional has been notified.");
          navigate("/projects");
        }}
      />
    </div>
  );
};

export default ProviderProfile;
