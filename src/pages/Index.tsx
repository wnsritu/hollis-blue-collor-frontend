import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Droplets,
  FileText,
  Home as HomeIcon,
  MapPin,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trees,
  Wrench,
  Zap,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderCard } from "@/components/shared/cards";
import { SectionHeading, Stars } from "@/components/shared/primitives";
import SiteFooter from "@/components/SiteFooter";

const categories = [
  { id: "1", name: "Plumbing", description: "Leaks, pipe repair, drain clearing & water heater install.", icon: Droplets, pros: 128 },
  { id: "2", name: "Electrical", description: "Wiring, panel upgrades, light fixture install & outlets.", icon: Zap, pros: 94 },
  { id: "3", name: "HVAC", description: "AC repair, furnace tune-up, duct cleaning & thermostats.", icon: WindIcon, pros: 76 },
  { id: "4", name: "Cleaning", description: "Deep cleaning, move-in/out, maid service & carpet wash.", icon: Sparkles, pros: 112 },
  { id: "5", name: "Roofing", description: "Shingle repair, leak patch, gutter cleaning & roof inspection.", icon: HomeIcon, pros: 64 },
  { id: "6", name: "Landscaping", description: "Lawn care, tree trimming, garden design & sprinkler repair.", icon: Trees, pros: 88 },
  { id: "7", name: "Remodeling", description: "Kitchen remodel, bathroom update, flooring & drywall.", icon: Hammer, pros: 52 },
  { id: "8", name: "Handyman", description: "Small repairs, TV mounting, assembly & door fix.", icon: Wrench, pros: 140 },
];

function WindIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
    </svg>
  );
}

const mockProviders = [
  { id: "1", name: "ABC Plumbing Co.", initials: "AP", category: "Plumbing", rating: 4.9, reviews: 128, startingPrice: 125, featured: true, verified: true, city: "Austin", state: "TX", years: 12, availability: "Available Today" },
  { id: "2", name: "Sparkle Clean Co.", initials: "SC", category: "House Cleaning", rating: 4.8, reviews: 94, startingPrice: 49, featured: true, verified: true, city: "Round Rock", state: "TX", years: 8, availability: "Available Tomorrow" },
  { id: "3", name: "Grand Park Electricians", initials: "GE", category: "Electrical", rating: 4.95, reviews: 156, startingPrice: 95, featured: true, verified: true, city: "Cedar Park", state: "TX", years: 15, availability: "Available Today" },
  { id: "4", name: "Comfort Air HVAC", initials: "CA", category: "HVAC", rating: 4.85, reviews: 82, startingPrice: 85, featured: true, verified: true, city: "Phoenix", state: "AZ", years: 10, availability: "Available Today" },
];

const popularServicesGrid = [
  { top: "LAUNDRY SERVICES", name: "Wash & Fold", description: "Seamless pickup & delivery for household laundry and linens." },
  { top: "HOUSE CLEANING", name: "Deep Cleaning", description: "Thorough room-by-room deep clean for move-ins and recurring care." },
  { top: "CAR WASH", name: "Exterior Detail", description: "Mobile car wash and exterior hand wash at your home or office." },
  { top: "HANDYMAN", name: "TV Mounting", description: "Hardware mounting, drywall anchors, and wire concealment." },
  { top: "DISINFECTION", name: "Sanitization", description: "Hospital-grade fogging and surface sanitization for homes & offices." },
  { top: "LAWN & GARDEN", name: "Lawn Mowing", description: "Weekly mowing, edging, blowing, and leaf cleanup for residential yards." },
];

const steps = [
  { n: "01", title: "Tell us what you need", body: "Describe the job in a few minutes — photos and budget optional." },
  { n: "02", title: "Get matched with pros", body: "We route your request to verified professionals in your ZIP." },
  { n: "03", title: "Compare proposals", body: "Line-item pricing, timelines and ratings side by side." },
  { n: "04", title: "Schedule and get it done", body: "Book the date, pay through the platform, leave a review." },
];

const trust = [
  { icon: BadgeCheck, title: "Verified professionals", body: "License, insurance and identity checked before a pro can bid." },
  { icon: Star, title: "Real customer reviews", body: "Reviews are tied to completed, paid jobs — never anonymous." },
  { icon: FileText, title: "Transparent proposals", body: "Labor, materials, fees and taxes broken out on every bid." },
  { icon: ShieldCheck, title: "Secure platform payments", body: "Pay in one place with a receipt and dispute trail." },
];

export function Index() {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    navigate(`/search?service=${encodeURIComponent(service)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="absolute inset-0 grid-dots opacity-60" aria-hidden />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" /> 6,015 homeowners hired a pro this month
            </span>
            <h1 className="mt-5 text-balance-tight text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Find Trusted Professionals for Your Next Job
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Connect with qualified local service providers, compare proposals, schedule your service, and
              get the job done with confidence.
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-card p-3 shadow-lift">
              <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_auto]">
                <div className="relative min-w-0">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="What service do you need?"
                    className="h-12 border-0 bg-muted/50 pl-9 text-base shadow-none focus-visible:bg-background"
                  />
                </div>
                <div className="relative min-w-0">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ZIP Code or City"
                    className="h-12 border-0 bg-muted/50 pl-9 text-base shadow-none focus-visible:bg-background"
                  />
                </div>
                <Button size="lg" className="h-12" onClick={handleSearch}>
                  Search
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 pb-1">
                <span className="mr-1 text-xs text-muted-foreground">Popular:</span>
                {["Plumbing", "Electrical", "HVAC", "Cleaning", "Roofing", "Landscaping", "Remodeling", "Handyman"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setService(s)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/search">
                  Find a Professional <ArrowRight size={17} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative min-w-0">
            <div className="space-y-3">
              <FlowCard
                step="Request"
                icon={ClipboardList}
                title="Water heater replacement"
                meta="Austin, TX 78704 · Emergency"
              >
                <p className="text-sm text-muted-foreground">
                  “50 gallon gas unit leaking from the base. Need same-day replacement.”
                </p>
              </FlowCard>

              <Connector label="Matched with 4 verified pros in 12 minutes" />

              <FlowCard step="Matches" icon={BadgeCheck} title="Nearby professionals" meta="Within 30 miles">
                <div className="space-y-2">
                  {mockProviders.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                        {p.initials}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                        <Star size={12} className="fill-accent text-accent" />
                        {p.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </FlowCard>

              <Connector label="Proposals with line-item pricing" />

              <FlowCard step="Proposal" icon={FileText} title="ABC Plumbing Co." meta="Accepted · Tomorrow 8:00 AM">
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { k: "Labor", v: "$420" },
                    { k: "Materials", v: "$780" },
                    { k: "Total", v: "$1,285" },
                  ].map((i) => (
                    <div key={i.k} className="rounded-xl bg-muted/50 px-2 py-2">
                      <dt className="text-[11px] text-muted-foreground">{i.k}</dt>
                      <dd className="font-display text-sm font-bold">{i.v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success">
                  <CheckCircle2 size={16} /> Job completed &amp; paid · 5.0 review left
                </div>
              </FlowCard>
            </div>
          </div>
        </div>
      </section>

      {/* Popular services categories */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Categories"
          title="Popular services"
          subtitle="Thousands of licensed pros across the most requested home service categories."
          action={
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/search">
                Browse all <ArrowRight size={16} />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/search"
              className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{c.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-3 text-xs font-semibold text-primary">
                {c.pros} professionals
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            center
            eyebrow="How it works"
            title="Four steps from problem to done"
            subtitle="No phone tag, no mystery pricing, no chasing contractors."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="font-display text-3xl font-extrabold text-primary/25">{s.n}</span>
                <h3 className="mt-2 font-display text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Why Hollis"
          title="Built on verification, not guesswork"
          subtitle="Every professional is screened, every proposal is itemized, every payment is tracked."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <span className="grid size-11 place-items-center rounded-xl bg-success-soft text-success">
                <t.icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated Pros */}
      <section className="border-t border-border bg-surface py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Featured"
            title="Top-rated professionals"
            subtitle="Highly reviewed businesses currently accepting new work."
            action={
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to="/search">See all pros</Link>
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockProviders.map((p) => (
              <ProviderCard key={p.id} provider={p} compact />
            ))}
          </div>
        </div>
      </section>

      {/* Fixed Price Services Grid */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Popular services"
          title="Book a fixed-price service in minutes"
          subtitle="Pick the service, choose a slot from the pro's calendar and pay securely."
          action={
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/search">
                Browse all services <ArrowRight size={16} />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popularServicesGrid.map((s) => (
            <Link
              key={`${s.top}-${s.name}`}
              to="/search"
              className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{s.top}</span>
              <h3 className="mt-2 font-display text-base font-bold">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                Find a pro <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Dual CTA Cards */}
      <section className="container-page pb-20">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left Dark Blue Card */}
          <div className="rounded-3xl bg-ink p-8 text-ink-foreground sm:p-10">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ClipboardList size={20} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Looking for a service?</h2>
            <p className="mt-3 max-w-md text-sm opacity-80 sm:text-base">
              Explore verified local service professionals and compare transparent pricing for your project.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/search">Find a Professional</Link>
            </Button>
          </div>

          {/* Right White Card */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-card sm:p-10">
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-soft-foreground">
              <MessagesSquare size={20} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Grow your service business</h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              Connect with customers looking for professionals like you. Pay a flat subscription — no per-lead surprises.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars rating={5} /> 1,148 professionals already on the platform
            </div>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/register">Join as a Professional</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FlowCard({
  step,
  icon: Icon,
  title,
  meta,
  children,
}: {
  step: string;
  icon: any;
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lift">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{step}</p>
          <p className="truncate font-display text-sm font-bold">{title}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4">
      <span className="h-6 w-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export default Index;
