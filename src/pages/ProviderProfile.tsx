import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Loader2,
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

const sampleProviderFaqs = [
  {
    question: "Do you provide same-day service?",
    answer: "Yes, same-day emergency service is available depending on current scheduling availability and service location.",
  },
  {
    question: "Do you offer free estimates?",
    answer: "We offer free initial consultations and upfront flat-rate quotes before any work begins.",
  },
  {
    question: "Are your plumbers/technicians licensed and insured?",
    answer: "All our technicians are fully licensed, background-checked, and backed by full liability insurance.",
  },
  {
    question: "What warranty do you provide on repairs?",
    answer: "We provide a 1-year warranty on all labor and pass through full manufacturer warranties on installed parts.",
  },
];

const mockReviews = [
  {
    id: 1,
    customer: "Sarah Whitfield",
    date: "2 days ago",
    rating: 5,
    title: "Excellent service & clear pricing",
    body: "Arrived right on time, explained the issue thoroughly, and completed the repair quickly. Highly recommend!",
  },
  {
    id: 2,
    customer: "Michael Brown",
    date: "1 week ago",
    rating: 5,
    title: "Very professional and clean work",
    body: "Great communication throughout the job. Left the workspace spotless when finished.",
  },
];

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
        // Fallback to legacy endpoint
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

  // Parse fields safely
  const name = provider?.business_name || provider?.user?.full_name || "Service Professional";
  const avatarPhoto = provider?.profile_photo || provider?.user?.profile_image || provider?.profile_image || null;
  const initials = name.slice(0, 2).toUpperCase();
  const verified = provider?.verified === "verified" || provider?.status === "active";
  const featured = Boolean(provider?.is_featured || provider?.featured);
  const tagline = provider?.service_description || "";
  const about = provider?.service_description || "No business description available.";
  const rating = Number(provider?.rating) || 0;
  const reviewsCount = Number(provider?.review_count ?? provider?.reviews_count ?? 0);
  const city = provider?.city || "";
  const state = provider?.state || "";
  const zip = provider?.zip_code || "";
  const years = Number(provider?.years_of_experience ?? provider?.experience ?? 0);
  const startingPrice = Number(provider?.starting_price) || 0;
  const responseTime = "Under 1 hour";

  // Parse services
  let servicesList: Array<{ name: string; price: number }> = [];
  if (provider?.category?.service_types && Array.isArray(provider.category.service_types)) {
    servicesList = provider.category.service_types.map((st: any) => ({
      name: st.name,
      price: Number(st.provider_services?.amount) || startingPrice,
    }));
  } else if (Array.isArray(provider?.services)) {
    servicesList = provider.services.map((s: any) => ({
      name: typeof s === "string" ? s : s.name,
      price: typeof s === "object" ? Number(s.price || s.amount) || startingPrice : startingPrice,
    }));
  }

  if (servicesList.length === 0) {
    servicesList = [
      { name: "Plumbing Repair", price: startingPrice },
      { name: "Water Heater Installation", price: 850 },
      { name: "Emergency Service", price: 150 },
      { name: "Drain Cleaning & Hydro Jetting", price: 210 },
    ];
  }

  // Parse FAQs
  let faqsList = sampleProviderFaqs;
  if (provider?.faqs) {
    try {
      const parsedFaqs = typeof provider.faqs === "string" ? JSON.parse(provider.faqs) : provider.faqs;
      if (Array.isArray(parsedFaqs) && parsedFaqs.length > 0) {
        faqsList = parsedFaqs;
      }
    } catch (e) {}
  }

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
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tagline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-foreground font-semibold">
                    <Stars rating={rating} />
                    <span>{rating.toFixed(1)}</span>
                    <span className="font-normal text-muted-foreground">({reviewsCount} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-primary" /> {city}, {state} {zip}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award size={14} /> {years} years in business
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> Responds {responseTime.toLowerCase()}
                  </span>
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

              <Button size="lg" onClick={() => setQuoteModalOpen(true)} className="gap-2">
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

          {/* Services Offered */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Services offered</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {servicesList.map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border p-4 bg-muted/20 hover:border-primary/40 transition-colors"
                >
                  <p className="font-semibold text-foreground text-sm">{s.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    starting at <span className="font-bold text-primary">{usd(s.price)}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Asked Questions */}
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

          {/* Reviews */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Reviews ({reviewsCount})</h2>
            <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl bg-muted/40 p-5">
              <div>
                <p className="font-display text-4xl font-extrabold">{rating.toFixed(1)}</p>
                <Stars rating={rating} />
              </div>
              <div className="min-w-[180px] flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 82 : star === 4 ? 13 : star === 3 ? 3 : star === 2 ? 1 : 1;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {mockReviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{r.customer}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="mt-1">
                    <Stars rating={r.rating} size={13} />
                  </div>
                  <p className="mt-2 font-medium text-xs text-foreground">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <aside className="h-max space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs text-muted-foreground">Starting price</p>
            <p className="font-display text-3xl font-extrabold text-primary">
              {usd(startingPrice)}
            </p>

            <div className="mt-5">
              <Button size="lg" className="w-full" onClick={() => setQuoteModalOpen(true)}>
                Request a Quote
              </Button>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-muted-foreground border-t border-border pt-5">
              <li className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-success shrink-0" />
                <span>License & insurance verified</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <span>Background checked</span>
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary shrink-0" />
                <span>Free upfront estimates</span>
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
        onProjectCreated={() => {
          toast.success("Quote request posted! The professional will review your project details.");
          navigate("/projects");
        }}
      />
    </div>
  );
};

export default ProviderProfile;
