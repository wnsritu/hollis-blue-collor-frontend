import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Shirt,
  Star,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Bell,
  Quote,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  Car,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/HeroSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProviderCard from "@/components/ProviderCard";
import { providers } from "@/data/mockData";
import customerVideo from "@/assets/Customer-Unik-Clean01.mp4";
import providerVideo from "@/assets/Provider-Unik-Clean01.mp4";
import AuthModal from "@/components/AuthModal";

const steps = [
  {
    num: "01",
    title: "Book Service",
    desc: "Select items, choose a time slot, and submit your booking in minutes.",
  },
  {
    num: "02",
    title: "Track Order",
    desc: "Follow your order status in real-time from pickup to delivery.",
  },
  {
    num: "03",
    title: "Get it Done",
    desc: "Receive your fresh, clean clothes right at your doorstep.",
  },
];

const services = [
  {
    icon: Shirt,
    name: "Laundry",
    desc: "Professional laundry services including wash, fold, iron & delivery.",
  },
  {
    icon: Sparkles,
    name: "House Cleaning",
    desc: "Standard, deep, and move-in/move-out cleaning packages.",
  },
  {
    icon: Car,
    name: "Car Wash",
    desc: "Premium exterior, interior, and full-detail mobile car wash packages.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    rating: 5,
    text: "Incredible service! My clothes came back perfectly pressed and smelling amazing. Will definitely use again.",
    avatar: "SM",
  },
  {
    name: "James R.",
    rating: 5,
    text: "So convenient. I booked in minutes and tracked my order the entire time. The provider was professional and fast.",
    avatar: "JR",
  },
  {
    name: "Maria L.",
    rating: 4,
    text: "Great quality and fair pricing. The pickup and delivery was right on time. Highly recommend for busy professionals.",
    avatar: "ML",
  },
];

const faqs = [
  {
    q: "How does booking work?",
    a: "Simply search for providers near you, select the services you need, pick a date and time slot, and submit your booking. The provider will confirm shortly.",
  },
  {
    q: "How are payments handled?",
    a: "Payments are processed securely through our platform. You pay after confirming your order, and funds are held until the service is completed.",
  },
  {
    q: "Can I cancel an order?",
    a: "Yes, you can cancel an order before the provider starts processing it. Cancellation policies may vary by provider.",
  },
  {
    q: "How are providers verified?",
    a: "All providers go through an identity verification process, including ID checks and background screening, before being listed on the platform.",
  },
];


const HomeSections = () => {

  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<"auth" | null>(null);
  const [authDefaultRole, setAuthDefaultRole] = useState<"customer" | "provider">("customer");
  const [videoTab, setVideoTab] = useState<"customer" | "provider">("customer");

  const handleOpenAuth = (role: "customer" | "provider") => {
    setAuthDefaultRole(role);
    setActiveModal("auth");
  };

  const featured = providers.slice(0, 4);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const featuredFixed = featured.map((p) => ({
    ...p,
    image: p.photo, // 🔥 fix for ProviderCardProps
  }));


  return (
    <>
      <div className="overflow-hidden">
        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="section-spacing">
          <div className="container-grid">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Simple Process
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                How Unik Clean Works
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Get your services done in four easy steps
              </p>
            </div>
            <div className="mt-8 mb-16 flex flex-col items-center gap-8 max-w-4xl mx-auto">
              {/* Toggle Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setVideoTab("customer")}
                  className={`px-6 py-3 rounded-full text-base font-semibold shadow-md transition-all duration-300 transform hover:scale-105 ${videoTab === "customer"
                    ? "bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-600/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  For Customers
                </button>
                <button
                  onClick={() => setVideoTab("provider")}
                  className={`px-6 py-3 rounded-full text-base font-semibold shadow-md transition-all duration-300 transform hover:scale-105 ${videoTab === "provider"
                    ? "bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-600/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  For Providers
                </button>
              </div>

              {/* Video & Content Display Card */}
              <div className="w-full grid gap-8 md:grid-cols-2 items-center bg-card rounded-3xl border border-border p-6 md:p-8 shadow-lg">
                <div className="space-y-4 text-left">
                  <h3 className="font-heading text-2xl font-bold text-foreground transition-all duration-300 animate-fade-in">
                    {videoTab === "customer"
                      ? "For Customers it’s easy to get the service done"
                      : "For Providers it’s easier to help your customers"}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {videoTab === "customer"
                      ? "Browse through verified local service providers, choose your service type, customize details, and book your slot in a few taps. Secure payments, live tracking, and easy communication are all built-in."
                      : "Grow your business, set your own pricing and service types, define your working hours, and manage all your customer requests on a simplified dashboard designed for growth."}
                  </p>
                  <div className="pt-2">
                    {videoTab === "customer" ? (
                      <Button
                        className="gap-2"
                        size="lg"
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            handleOpenAuth("customer");
                          } else {
                            navigate("/search");
                          }
                        }}
                      >
                        Find Providers <ArrowRight size={16} />
                      </Button>
                    ) : (
                      <Button
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            handleOpenAuth("provider");
                          } else {
                            navigate("/provider/dashboard");
                          }
                        }}
                      >
                        Become a Provider <ArrowRight size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-inner flex items-center justify-center w-full">
                  <video
                    key={videoTab}
                    src={videoTab === "customer" ? customerVideo : providerVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full aspect-video object-left object-cover transition-opacity duration-500"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.num} className="group relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 font-heading text-xl font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {step.num}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  {/* <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p> */}
                  {i < steps.length - 1 && (
                    <div className="absolute right-0 top-8 hidden w-full translate-x-1/2 lg:block">
                      <div className="mx-auto h-px w-3/4 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Services ─── */}
        <section id="services" className="section-spacing bg-muted/30">
          <div className="container-grid">
            <div className="text-center">
              <span className="inline-block bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                What We Offer
              </span>
              <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                Our Services
              </h2>
            </div>
            <div className="mt-12 grid gap-6 max-w-4xl mx-auto sm:grid-cols-3">
              {services.map((s) => (
                <Card
                  key={s.name}
                  className="card-elevated border-0 bg-card text-center"
                >
                  <CardContent className="p-8">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <s.icon size={26} />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── For Customers & Providers ─── */}
        <section className="section-spacing">
          <div className="container-grid">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Customers */}
              <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-8 sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  FOR CUSTOMERS
                </p>
                <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">
                  Get your Cleaning handled
                </h3>
                <ul className="mt-6 space-y-4">
                  {[
                    "Find nearby providers",
                    "Easy booking system",
                    "Secure payments",
                    "Real-time order tracking",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-secondary"
                      />{" "}
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 gap-2"
                  size="lg"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      handleOpenAuth("customer");
                    } else {
                      navigate("/search");
                    }
                  }}
                >
                  Book Now <ArrowRight size={16} />
                </Button>
              </div>

              {/* Providers */}
              <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/5 to-transparent p-8 sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
                  FOR PROVIDERS
                </p>
                <h3 className="mt-2 font-heading text-2xl font-bold text-foreground">
                  Grow your business
                </h3>
                <ul className="mt-6 space-y-4">
                  {[
                    "Get more orders",
                    "Set your own pricing",
                    "Flexible availability",
                    "Fast payouts",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-secondary"
                      />{" "}
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="mt-8 gap-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                  size="lg"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      handleOpenAuth("provider");
                    } else {
                      navigate("/provider/dashboard");
                    }
                  }}
                >
                  Become a Provider <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Featured Providers ─── */}
        <section className="section-spacing bg-muted/30 border-b border-border">
          <div className="container-grid">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Top Choice</p>
                <h2 className="mt-1 font-heading text-3xl font-bold text-foreground">Featured Providers</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const el = document.getElementById("featured-scroller-howitworks");
                    if (el) el.scrollBy({ left: -340, behavior: "smooth" });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent hover:text-primary transition-colors shadow-sm font-bold"
                >
                  &larr;
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("featured-scroller-howitworks");
                    if (el) el.scrollBy({ left: 340, behavior: "smooth" });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent hover:text-primary transition-colors shadow-sm font-bold"
                >
                  &rarr;
                </button>
              </div>
            </div>

            <div
              id="featured-scroller-howitworks"
              className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredFixed.map((provider) => (
                <div
                  key={provider.id}
                  className="min-w-[300px] sm:min-w-[340px] max-w-[360px] snap-start flex-shrink-0"
                >
                  <ProviderCard
                    key={provider.id}
                    {...provider}
                    showMessage={false}
                    onAuthRequired={() => {
                      setAuthDefaultRole("customer");
                      setActiveModal("auth");
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Video Demo Section ─── */}
        {/* <section className="section-spacing bg-muted/30 border-t border-b border-border">
          <div className="container-grid">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="font-heading text-3xl font-bold text-foreground">See How Unik Clean Works</h2>
              <p className="mt-3 text-muted-foreground">Explore how simple it is to get your services done or manage your business.</p>
            </div>

            <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
              <div className="flex gap-4">
                <button
                  onClick={() => setVideoTab("customer")}
                  className={`px-6 py-3 rounded-full text-base font-semibold shadow-md transition-all duration-300 transform hover:scale-105 ${videoTab === "customer"
                    ? "bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-600/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  For Customers
                </button>
                <button
                  onClick={() => setVideoTab("provider")}
                  className={`px-6 py-3 rounded-full text-base font-semibold shadow-md transition-all duration-300 transform hover:scale-105 ${videoTab === "provider"
                    ? "bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-600/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  For Providers
                </button>
              </div>

              <div className="w-full grid gap-8 md:grid-cols-2 items-center bg-card rounded-3xl border border-border p-6 md:p-8 shadow-lg">
                <div className="space-y-4 text-left">
                  <h3 className="font-heading text-2xl font-bold text-foreground transition-all duration-300 animate-fade-in">
                    {videoTab === "customer"
                      ? "For Customers it’s easy to get the service done"
                      : "For Providers it’s easier to help your customers"}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {videoTab === "customer"
                      ? "Browse through verified local service providers, choose your service type, customize details, and book your slot in a few taps. Secure payments, live tracking, and easy communication are all built-in."
                      : "Grow your business, set your own pricing and service types, define your working hours, and manage all your customer requests on a simplified dashboard designed for growth."}
                  </p>
                  <div className="pt-2">
                    {videoTab === "customer" ? (
                      <Button
                        className="gap-2"
                        size="lg"
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            handleOpenAuth("customer");
                          } else {
                            navigate("/search");
                          }
                        }}
                      >
                        Find Providers <ArrowRight size={16} />
                      </Button>
                    ) : (
                      <Button
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                        onClick={() => {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            handleOpenAuth("provider");
                          } else {
                            navigate("/provider/dashboard");
                          }
                        }}
                      >
                        Become a Provider <ArrowRight size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-inner aspect-video flex items-center justify-center w-full">
                  <video
                    key={videoTab}
                    src={
                      videoTab === "customer"
                        ? "https://cdn.prod.website-files.com/688ce44173bb547d3775ca3f%2F6936e5ed756641e5730067dd_intake%20management_mp4.mp4"
                        : "https://cdn.prod.website-files.com/688ce44173bb547d3775ca3f%2F6936e397d1e40a050a4588d6_CRM_mp4.mp4"
                    }
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* ─── App Experience ─── */}
        <section className="section-spacing bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container-grid">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Platform Experience
                </p>
                <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  Everything at your fingertips
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      icon: Search,
                      title: "Track orders in real-time",
                      desc: "Follow every step from pickup to delivery with live status updates.",
                    },
                    {
                      icon: MessageCircle,
                      title: "Chat with providers",
                      desc: "Communicate directly with your service provider anytime.",
                    },
                    {
                      icon: Bell,
                      title: "Get notifications",
                      desc: "Stay updated with instant alerts on order progress.",
                    },
                  ].map((f) => (
                    <div key={f.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <f.icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {f.title}
                        </h4>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Phone mockup */}
              <div className="flex justify-center">
                <div className="relative w-64">
                  <div className="rounded-[2.5rem] border-[6px] border-foreground/10 bg-card p-4 shadow-2xl">
                    <div className="mx-auto mb-4 h-5 w-20 rounded-full bg-foreground/10" />
                    <div className="space-y-3 rounded-2xl bg-muted/50 p-4">
                      <div className="h-3 w-3/4 rounded bg-primary/20" />
                      <div className="h-3 w-1/2 rounded bg-muted-foreground/20" />
                      <div className="mt-4 rounded-xl bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-secondary/20" />
                          <div className="space-y-1">
                            <div className="h-2.5 w-24 rounded bg-foreground/15" />
                            <div className="h-2 w-16 rounded bg-muted-foreground/15" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20" />
                          <div className="space-y-1">
                            <div className="h-2.5 w-20 rounded bg-foreground/15" />
                            <div className="h-2 w-28 rounded bg-muted-foreground/15" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 h-9 rounded-lg bg-primary/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="section-spacing">
          <div className="container-grid">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Testimonials
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
                What our customers say
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="card-elevated border-0 bg-card">
                  <CardContent className="p-6">
                    <Quote size={24} className="mb-4 text-primary/20" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t.text}
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t.name}
                        </p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className="fill-primary text-primary"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container-grid py-12 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              {/* LEFT SIDE */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  About Us
                </div>

                <h1 className="font-heading text-3xl font-bold leading-[1.1] text-foreground sm:text-4xl lg:text-5xl text-balance">
                  Care isn't just a service it's a{" "}
                  <span className="text-primary">feeling</span>
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                  We started this platform with something very simple in mind:
                  family. Our abuela has always taken pride in caring for
                  clothes washing, folding, ironing doing it with love,
                  attention, and a level of care that machines and big
                  businesses just can’t match.
                </p>

                <Button onClick={() => navigate("/about")} size="lg" className="px-6">
                  View More
                </Button>
              </div>

              {/* RIGHT SIDE IMAGE */}
              <div className="hidden lg:block">
                <div className=" rounded-3xl">
                  <HeroSection variant="about" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="section-spacing bg-muted/30">
          <div className="container-grid">
            <div className="mx-auto max-w-2xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  FAQ
                </p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
              </div>
              <Accordion type="single" collapsible className="mt-10">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-border"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="section-spacing">
          <div className="container-grid">
            <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 px-8 py-16 text-center sm:px-16">
              <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
                Ready to simplify your cleaning?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
                Join thousands of customers and providers on the platform built
                for care.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      handleOpenAuth("customer");
                    } else {
                      navigate("/search");
                    }
                  }}
                >
                  Find Providers <ArrowRight size={16} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-sm"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      handleOpenAuth("provider");
                    } else {
                      navigate("/provider/dashboard");
                    }
                  }}
                >
                  Become a Provider
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-border bg-card">
          <div className="container-grid py-16">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 font-heading text-lg font-bold text-primary">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                    U
                  </span>
                  Unik Clean
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Cleaning services marketplace. Connecting customers with
                  trusted professionals.
                </p>
                <div className="mt-5 flex gap-3">
                  {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                  Company
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {["About", "Careers", "Contact", "Blog"].map((link) => (
                    <li key={link}>
                      <a
                        href="/about"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                  Services
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {["Wash", "Fold", "Iron", "Hang", "Pickup & Delivery"].map(
                    (link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {link}
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
                  Legal
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                    (link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {link}
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
              © 2026 Unik Clean. All rights reserved. Handled with care.
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        open={activeModal === "auth"}
        onClose={() => setActiveModal(null)}
        defaultRole={authDefaultRole}
        onLogin={(roleId) => {
          setActiveModal(null);
          if (roleId === 3) {
            navigate("/dashboard");
          } else if (roleId === 4) {
            navigate("/provider/dashboard");
          }
        }}
      />
    </>
  );
};

export default HomeSections;
