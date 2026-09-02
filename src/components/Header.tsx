import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import AuthModal from "@/components/AuthModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { getMyProfile } from "@/services/user.service";
import { Logo } from "@/components/shared/primitives";
import { clearAllBookingState } from "@/utils/bookingState";
import { cn } from "@/lib/utils";

const customerNav = [
  { labelKey: "dashboard", path: "/dashboard" },
  { labelKey: "Book Services", path: "/search" },
  { labelKey: "orders", path: "/orders" },
  { labelKey: "messages", path: "/messages" },
];

const providerNav = [
  { labelKey: "dashboard", path: "/provider/dashboard" },
  { labelKey: "providerOrders", path: "/provider/orders" },
  { labelKey: "pricing", path: "/provider/pricing" },
  { labelKey: "availability", path: "/provider/availability" },
  { labelKey: "messages", path: "/messages" },
  { labelKey: "earnings", path: "/provider/earnings" },
];

const links = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Find a Professional" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/register", label: "Become a Pro" },
] as const;

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [authDefaultRole, setAuthDefaultRole] = useState<"customer" | "provider">("customer");
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<"auth" | "forgot" | null>(null);
  const [user, setUser] = useState<any>(null);

  const ROLE_MAP = {
    customer: 3,
    provider: 4,
  };

  const isLoggedIn = userRole !== null;
  const isVerifiedProvider = userRole === ROLE_MAP.provider && user?.provider?.verified;

  const navItems =
    userRole === ROLE_MAP.provider
      ? isVerifiedProvider
        ? providerNav
        : []
      : userRole === ROLE_MAP.customer
        ? customerNav
        : [];

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMyProfile();
        setUser(res.data);
      } catch (err) {
        console.log("HEADER PROFILE ERROR:", err);
      }
    };

    const savedRole = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (savedRole && token) {
      setUserRole(Number(savedRole));
      fetchUser();
    } else {
      setUserRole(null);
      setUser(null);
    }
  }, [location.pathname]);

  const handleOpenAuth = (role: "customer" | "provider") => {
    setAuthDefaultRole(role);
    setActiveModal("auth");
  };

  const handleLogin = async (roleId: number) => {
    setUserRole(roleId);
    try {
      const res = await getMyProfile();
      const userData = res.data;
      setUser(userData);
      if (roleId === ROLE_MAP.provider) {
        if (userData.is_profile_setup) {
          return navigate("/provider/dashboard");
        } else if (userData?.provider?.verified === "verified") {
          return navigate("/provider/pricing");
        } else {
          return navigate("/provider/profile");
        }
      } else if (roleId === ROLE_MAP.customer) {
        navigate("/dashboard");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    localStorage.removeItem("userRoleId");
    setProfileOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const getInitials = (user: any) => {
    if (!user) return "U";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const dashboardRoute =
    userRole === ROLE_MAP.provider
      ? "/provider/dashboard"
      : userRole === ROLE_MAP.customer
        ? "/dashboard"
        : "/admin";

  return (
    <>
      <header
        className={cn(
          "sticky z-50 border-b border-border/80 bg-background/95 backdrop-blur-md transition-all duration-300",
          isAtTop ? "top-0 sm:top-0" : "top-0 sm:top-4"
        )}
      >
        <div className="container-page flex h-14 w-full items-center justify-between md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4">
          <Logo overhanging isAtTop={isAtTop} />

          <nav className="hidden min-w-0 items-center justify-center gap-2 md:flex">
            {!isLoggedIn ? (
              links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                    location.pathname === l.to ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              ))
            ) : (
              navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (item.path === "/search") {
                      clearAllBookingState();
                    }
                  }}
                  className={`relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                    location.pathname === item.path ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t(item.labelKey)}
                  {item.labelKey === "messages" && user?.isUnread && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
                  )}
                </Link>
              ))
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-border transition-transform hover:scale-105"
                >
                  {user?.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${user.profile_image}`}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(user)
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-card z-50">
                    <Link
                      to={dashboardRoute}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to={userRole === ROLE_MAP.provider ? "/provider/profile" : "/profile"}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <User size={14} /> {t("profile")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive-soft transition-colors"
                    >
                      <LogOut size={14} /> {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAuth("customer")}
                  className="hidden sm:inline-flex text-sm font-medium"
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenAuth("provider")}
                  className="hidden sm:inline-flex rounded-full px-5"
                >
                  Get started
                </Button>
              </div>
            )}

            {/* Mobile Navigation Drawer matching Static SiteHeader.tsx */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm p-6">
                <div className="mt-8 flex flex-col gap-1">
                  {!isLoggedIn ? (
                    links.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-xl px-3 py-3 text-base font-medium hover:bg-secondary"
                      >
                        {l.label}
                      </Link>
                    ))
                  ) : (
                    navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-xl px-3 py-3 text-base font-medium hover:bg-secondary"
                      >
                        {t(item.labelKey)}
                      </Link>
                    ))
                  )}
                </div>
                <div className="mt-6 grid gap-2">
                  {!isLoggedIn ? (
                    <>
                      <Button
                        onClick={() => {
                          setMobileOpen(false);
                          handleOpenAuth("provider");
                        }}
                      >
                        Get started
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMobileOpen(false);
                          handleOpenAuth("customer");
                        }}
                      >
                        Log in
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                    >
                      Log out
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AuthModal
        open={activeModal === "auth"}
        onClose={() => setActiveModal(null)}
        onOpenForgot={() => setActiveModal("forgot")}
        defaultRole={authDefaultRole}
        onLogin={(roleId) => handleLogin(roleId)}
      />

      <ForgotPasswordModal
        roleId={userRole}
        open={activeModal === "forgot"}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal("auth")}
      />
    </>
  );
};

export default Header;
