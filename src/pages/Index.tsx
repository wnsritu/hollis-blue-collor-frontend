import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  ShieldCheck,
  Users,
  Package,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Shirt,
  ArrowRight,
  Sparkles,
  Car,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import HeroSection from "@/components/HeroSection";
import ProviderCard from "@/components/ProviderCard";
import AuthModal from "@/components/AuthModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import { providers } from "@/data/mockData";
import { getMyProfile } from "@/services/user.service";
import { getServiceTypes } from "@/services/provider.service";

const stats = [
  { icon: Star, value: "4.8", label: "Average Rating", suffix: "★" },
  { icon: Package, value: "10,000+", label: "Orders Completed" },
  { icon: Users, value: "500+", label: "Verified Providers" },
];


const Index = () => {
  const [selectedCategory,] = useState("");
  const [, setSelectedServiceType] = useState("");
  const [, setServiceTypes] = useState<any[]>([]);
  const navigate = useNavigate();

  const [showLoginSuggest, setShowLoginSuggest] = useState(false);
  const [pendingServicePath, setPendingServicePath] = useState("");
  const [activeModal, setActiveModal] = useState<"auth" | "forgot" | "admin" | null>(null);
  const [authDefaultRole, setAuthDefaultRole] = useState<"customer" | "provider">("customer");
  const [userRole, setUserRole] = useState<number | null>(null);

  const featured = providers.slice(0, 4);

  useEffect(() => {
    if (selectedCategory) {
      getServiceTypes({ category_id: Number(selectedCategory) })
        .then((res) => {
          setServiceTypes(res || []);
          setSelectedServiceType("");
        })
        .catch((err) => {
          console.error("Error fetching service types:", err);
          setServiceTypes([]);
        });
    } else {
      setServiceTypes([]);
      setSelectedServiceType("");
    }
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem("servicetype_id", "1");
    // Sync user role
    const localUser = localStorage.getItem("user");

    if (localUser) {
      try {
        const u = JSON.parse(localUser);
        setUserRole(u?.role_id || null);
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  const handleServiceClick = (toPath: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setPendingServicePath(toPath);
      setShowLoginSuggest(true);
    } else {
      navigate(toPath);
    }
  };

  const handleLoginSuccess = async (roleId: number) => {
    console.log("Login successful with role ID:", roleId);
    setUserRole(roleId);
    try {
      const res = await getMyProfile();
      const userData = res.data;
      localStorage.setItem("user", JSON.stringify(userData));

      // Close auth modal and redirect to pending path or dashboard
      setActiveModal(null);
      if (roleId === 3) { // Customer
        navigate(pendingServicePath || "/dashboard");
      } else if (roleId === 4) { // Provider
        if (userData?.provider?.verified) {
          navigate("/provider/dashboard");
        } else {
          navigate("/provider/profile");
        }
      }
    } catch (err) {
      console.error("Error setting user after login:", err);
    }
  };

  // Redirect logged-in users to their respective dashboards
  const token = localStorage.getItem("token");
  const savedRole = localStorage.getItem("userRole") || localStorage.getItem("userRoleId");

  useEffect(() => {
    if (token && savedRole) {
      const roleId = Number(savedRole);
      if (roleId === 1) {
        navigate("/admin");
      } else if (roleId === 2) {
        navigate("/support-dashboard");
      } else if (roleId === 3) {
        navigate("/dashboard");
      } else if (roleId === 4) {
        navigate("/provider/dashboard");
      }
    }
  }, [token, savedRole, navigate]);

  if (token && savedRole) {
    return null;
  }

  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─── */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container-grid py-12 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            {/* Left */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <ShieldCheck size={14} /> Trusted by 10,000+ customers
              </div>
              <h1 className="font-heading text-3xl font-bold leading-[1.1] text-foreground sm:text-4xl lg:text-5xl text-balance">
                Cleaning Services{" "}
                <span className="text-primary">Marketplace</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                Book trusted cleaning professionals near you for Laundry, House cleaning and Car washing.
              </p>
              <p className="text-base font-semibold text-secondary">
                Get your services done from $15.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  className="gap-2 font-semibold"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      setAuthDefaultRole("customer");
                      setActiveModal("auth");
                    } else {
                      navigate("/search");
                    }
                  }}
                >
                  Get a Service <ArrowRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 font-semibold border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      setAuthDefaultRole("provider");
                      setActiveModal("auth");
                    } else {
                      navigate("/provider/dashboard");
                    }
                  }}
                >
                  Become a Pro <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            {/* Right — image */}
            <div className="relative hidden lg:block">
              <HeroSection />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Indicators ─── */}
      <section className="border-y border-border bg-card">
        <div className="container-grid flex flex-col items-center justify-center gap-6 py-6 sm:flex-row sm:gap-14">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 text-center sm:text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured Providers Section ─── */}
      <section className="section-spacing bg-muted/10 border-b border-border">
        <div className="container-grid">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Top Choice</p>
              <h2 className="mt-1 font-heading text-3xl font-bold text-foreground">Featured Providers</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById("featured-scroller");
                  if (el) el.scrollBy({ left: -340, behavior: "smooth" });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent hover:text-primary transition-colors shadow-sm font-bold"
              >
                &larr;
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("featured-scroller");
                  if (el) el.scrollBy({ left: 340, behavior: "smooth" });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent hover:text-primary transition-colors shadow-sm font-bold"
              >
                &rarr;
              </button>
            </div>
          </div>

          <div
            id="featured-scroller"
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featured.map((provider) => (
              <div
                key={provider.id}
                className="min-w-[300px] sm:min-w-[340px] max-w-[360px] snap-start flex-shrink-0"
              >
                <ProviderCard
                  id={provider.id}
                  user_id={provider.id}
                  name={provider.name}
                  rating={provider.rating}
                  distance={provider.distance}
                  startingPrice={provider.startingPrice}
                  services={provider.services}
                  image={provider.photo}
                  location={provider.location}
                  description={provider.description}
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

      {/* ─── Choose a Service ─── */}
      <section id="choose-service" className="section-spacing bg-background">
        <div className="container-grid">
          <div className="text-center">
            <span className="inline-block bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              Choose Your Service
            </span>
            <h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">What can we help you with today?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Three trusted services, one platform — all handled with care.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Shirt, name: "Laundry", desc: "Wash, fold, iron & delivery from trusted local pros.", to: "/search", tag: "From $15" },
              { icon: Sparkles, name: "House Cleaning", desc: "Standard, deep, and move-in/move-out cleaning.", to: "/booking/cleaning", tag: "From $60" },
              { icon: Car, name: "Car Wash", desc: "Exterior, interior, and full-detail packages.", to: "/booking/carwash", tag: "From $15" },
            ].map((s) => (
              <button key={s.name} onClick={() => handleServiceClick(s.to)}
                className="group card-elevated rounded-2xl border border-border bg-card p-8 text-left transition-all hover:border-primary hover:-translate-y-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <s.icon size={26} />
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold text-foreground">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">{s.tag}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Book now <ArrowRight size={14} />
                  </span>
                </div>
              </button>
            ))}
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
                {["Laundry", "House Cleaning", "Car Wash"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const pathMap = {
                            "Laundry": "/search",
                            "House Cleaning": "/booking/cleaning",
                            "Car Wash": "/booking/carwash",
                          };
                          handleServiceClick(pathMap[link]);
                        }}
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

      {/* ─── Login Suggestion Dialog ─── */}
      <Dialog open={showLoginSuggest} onOpenChange={setShowLoginSuggest}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-500">
              <Key className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Please Login First
            </DialogTitle>
            <DialogDescription className="mt-2 text-center text-sm text-muted-foreground">
              For a better booking experience, please login or sign up to access service wizards.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowLoginSuggest(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowLoginSuggest(false);
                setAuthDefaultRole("customer");
                setActiveModal("auth");
              }}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Auth Modals ─── */}
      <AuthModal
        open={activeModal === "auth"}
        onClose={() => setActiveModal(null)}
        onOpenForgot={() => setActiveModal("forgot")}
        defaultRole={authDefaultRole}
        onLogin={(roleId) => handleLoginSuccess(roleId)}
      />

      <ForgotPasswordModal
        roleId={userRole}
        open={activeModal === "forgot"}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal("auth")}
      />
    </div>
  );
};

export default Index;
