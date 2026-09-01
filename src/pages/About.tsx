import { useNavigate } from "react-router-dom";
import {
  Heart,
  Globe,
  Target,
  Eye,
  ShieldCheck,
  Sliders,
  Users,
  TrendingUp,
  Landmark,
  BarChart3,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/HeroSection";

const purposeCards = [
  {
    icon: Heart,
    title: "Dignity",
    desc: "Empowering individuals through meaningful, respected work.",
  },
  {
    icon: Users,
    title: "Connection",
    desc: "Bridging communities through trusted, personal services.",
  },
  {
    icon: Globe,
    title: "Community",
    desc: "Strengthening local economies one service at a time.",
  },
];

const approachCards = [
  {
    icon: ShieldCheck,
    title: "Trust First",
    points: [
      "Verified providers",
      "Transparent pricing",
      "Clear communication",
    ],
  },
  {
    icon: Sliders,
    title: "Flexibility by Design",
    points: [
      "Customers choose service type",
      "Providers control pricing & availability",
    ],
  },
  {
    icon: Users,
    title: "Community-Powered Growth",
    points: ["Create income opportunities", "Strengthen local economies"],
  },
];

const investorCards = [
  { icon: BarChart3, label: "Transaction-based revenue" },
  { icon: Sparkles, label: "Featured provider placements" },
  { icon: TrendingUp, label: "Future subscription models" },
];

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background font-[var(--font-body)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            {/* LEFT SIDE */}
            <div className="flex justify-center lg:justify-center">
              <div className="max-w-[520px] text-center lg:text-left">
                <span className="inline-flex px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                  About Us
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[var(--font-heading)] text-foreground leading-tight mb-6">
                  Care isn't just a service it's a{" "}
                  <span className="text-primary">feeling</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  At Unik Clean, we bring human care back into everyday
                  services.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex justify-center lg:justify-center">
              <div className="w-[600px] h-[460px] overflow-hidden rounded-3xl">
                <HeroSection variant="about" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] text-foreground text-center mb-10">
            Our Story
          </h2>

          {/* Content */}
          <p
            className="text-muted-foreground text-base md:text-lg leading-relaxed text-justify"
            spellCheck={false}
          >
            Unik Clean was created with one idea in mind: real care comes from
            real people. Inspired by my abuela, whose pride in caring for
            clothes is unmatched. We built a platform that brings that same
            human touch back to everyday services while creating income
            opportunities in local communities.
            <br />
            <br />
            Across cultures, there’s always someone who does this work with love
            and precision. Unik Clean empowers these trusted individuals to
            offer home-based or in-home care services, giving customers
            reliable, personalized support they can count on.
          </p>
        </div>
      </section>

      {/* Purpose */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] text-foreground mb-4">
            More Than Just Cleaning
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            This isn't just about laundry. It's about dignity, connection, and
            creating income through meaningful work.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {purposeCards.map((c) => (
              <Card
                key={c.title}
                className="border-none shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <c.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-[var(--font-heading)] text-foreground mb-2">
                    {c.title}
                  </h3>
                  <p className="text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-md">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold font-[var(--font-heading)] text-foreground mb-4">
                  Our Mission
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  To empower individuals within local communities to generate
                  income through trusted, high-quality home care services, while
                  providing customers with convenient, transparent, and
                  personalized service experiences.
                </p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold font-[var(--font-heading)] text-foreground mb-4">
                  Our Vision
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become the leading global marketplace for community-driven
                  home services, where trust, flexibility, and human-centered
                  care redefine how everyday services are delivered.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] text-foreground mb-12">
            Our Principal
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {approachCards.map((c) => (
              <Card key={c.title} className="border-none shadow-md text-left">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <c.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-[var(--font-heading)] text-foreground mb-4">
                    {c.title}
                  </h3>
                  <ul className="space-y-2">
                    {c.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      {/* <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] text-foreground mb-6">
            Built for People, Powered by Community
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            We empower trusted individuals in the community to offer their
            services—whether from their own home or directly in yours.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            At the same time, we provide customers with reliable, personalized
            services they can trust.
          </p>
        </div>
      </section> */}

      {/* Investors */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-heading)] text-foreground mb-4">
              For Investors & Partners
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unik Clean operates at the intersection of the gig economy, home
              services, and community-based commerce.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {investorCards.map((c) => (
              <Card key={c.label} className="border-none shadow-md">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="font-medium text-foreground">{c.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* <Card className="border-none shadow-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground leading-relaxed">
                With increasing demand for flexible services and localized
                marketplaces, Unik Clean is positioned to scale globally while
                maintaining a strong community-driven foundation.
              </p>
            </CardContent>
          </Card> */}
        </div>
      </section>

      {/* Closing */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-[var(--font-heading)] text-foreground mb-8 leading-tight">
            Handled with care. Built on trust. Powered by community.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-base px-8"
              onClick={() => navigate("/search")}
            >
              Find Providers <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8"
              onClick={() => navigate("/signup")}
            >
              Become a Provider
            </Button>
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
                      href="#"
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
  );
};

export default About;
