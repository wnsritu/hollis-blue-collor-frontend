import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { languages } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import AuthModal from "@/components/AuthModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import AdminLoginModal from "@/pages/admin/AdminLogin";
import { getMyProfile } from "@/services/user.service";
import { clearAllBookingState } from "@/utils/bookingState";

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
  { labelKey: "featured", path: "/provider/featured" },
];

const landingNav = [{ label: "How it Works", anchor: "how-it-works" }];

const landingNav1 = [
  { label: "How it Works", anchor: "how-it-works" },
  { label: "Services", anchor: "services" },
  { label: "Pricing", anchor: "pricing" },
  { label: "FAQ", anchor: "faq" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [authDefaultRole, setAuthDefaultRole] = useState<
    "customer" | "provider"
  >("customer");
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [activeModal, setActiveModal] = useState<
    "auth" | "forgot" | "admin" | null
  >(null);
  const [user, setUser] = useState<any>(null);
  const ROLE_MAP = {
    customer: 3,
    provider: 4,
  };
  const isHome = location.pathname === "/";
  const isHow = location.pathname === "/how-it-works";

  const currentLang = i18n.language;
  const isLoggedIn = userRole !== null;

  const isVerifiedProvider =
    userRole === ROLE_MAP.provider && user?.provider?.verified;

  const navItems =
    userRole === ROLE_MAP.provider
      ? isVerifiedProvider
        ? providerNav
        : []
      : userRole === ROLE_MAP.customer
        ? customerNav
        : [];

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLangOpen(false);
  };

  const handleOpenAuth = (role: "customer" | "provider") => {
    setAuthDefaultRole(role);
    setActiveModal("auth");
  };

  const handleLogin = async (roleId: number) => {
    // debugger
    console.log("Login successful with role ID:", roleId);
    setUserRole(roleId);

    try {
      const res = await getMyProfile();
      const userData = res.data;
      // debugger
      // console.log("Fetched Profile:", userData);

      setUser(userData);
      if (roleId === ROLE_MAP.provider) {
        if (userData.is_profile_setup) {
          return navigate("/provider/dashboard");
        } else if (userData?.provider?.verified === "verified") {
          return navigate("/provider/pricing");
        } else {
          return navigate("/provider/profile");
        }
      }
      // ✅ CUSTOMER
      else if (roleId === ROLE_MAP.customer) {
        navigate("/dashboard");
      }

      // ✅ ADMIN
      else {
        navigate("/admin");
      }
    } catch (err) {
      console.log(err);
    }
  };

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

  const getInitials = (user) => {
    if (!user) return "";

    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";

    return (first + last).toUpperCase();
  };
  const handleLogout = () => {
    setUserRole(null);

    // ✅ CLEAR EVERYTHING
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    localStorage.removeItem("userRoleId");

    setProfileOpen(false);
    setMobileOpen(false);

    navigate("/");
  };

  const scrollToSection = (anchor: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(
        () =>
          document
            .getElementById(anchor)
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } else {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    // Profile fetch every 60 seconds for unread messages
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await getMyProfile();
          setUser(res.data);
        }
      } catch (err) {
        console.log("Error fetching profile:", err);
      }
    }, 60000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); //

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container-fluid flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-heading text-xl font-bold text-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              U
            </span>
            Unik Clean
          </Link>
          {/* Center nav — landing or role-based */}
          {/* <nav className="hidden items-center gap-1 lg:flex">
            {!isLoggedIn && isHome
              ? landingNav.map((item) => (
                  <button
                    key={item.anchor}
                    onClick={() => navigate(item.anchor)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))
              : isLoggedIn
                ? navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                        location.pathname === item.path
                          ? "bg-accent text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))
                : null}
          </nav> */}

          {/* <nav className="hidden items-center gap-1 lg:flex">
            {!isLoggedIn && isHome
              ? landingNav.map((item) => (
                  <button
                    key={item.anchor}
                    onClick={() =>
                      navigate("/how-it-works", {
                        state: { scrollTo: item.anchor },
                      })
                    } // ✅ FIX
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))
              : isLoggedIn
                ? navItems.map((item) => (
                    <Link key={item.path} to={item.path}>
                      {t(item.labelKey)}
                    </Link>
                  ))
                : null}
          </nav> */}

          {/* <nav className="hidden items-center gap-1 lg:flex">
            {!isLoggedIn && isHow
              ? landingNav1.map((item) => (
                  <button
                    key={item.anchor}
                    onClick={() => scrollToSection(item.anchor)}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))
              : isLoggedIn
                ? navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                        location.pathname === item.path
                          ? "bg-accent text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))
                : null}
          </nav> */}
          {/* <nav className="hidden items-center gap-1 lg:flex">
            {!isLoggedIn && isHow
              ? landingNav1.map((item) => (
                  <button
                    key={item.anchor}
                    onClick={() => {
                      document
                        .getElementById(item.anchor)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }} // ✅ ONLY SCROLL
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))
              : null}
          </nav> */}

          <nav className="hidden items-center gap-1 lg:flex">
            {/* 🌐 NOT LOGGED IN - LANDING / HOME */}
            {!isLoggedIn && !isHow && (
              <>
                {landingNav.map((item) => (
                  <button
                    key={item.anchor}
                    onClick={() => {
                      navigate("/how-it-works", {
                        state: { scrollTo: item.anchor },
                      });
                    }}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}

            {/* 🌐 NOT LOGGED IN - HOW IT WORKS PAGE */}
            {!isLoggedIn && isHow && (
              <>
                {landingNav1.map((item) => (
                  <button
                    key={item.anchor}
                    onClick={() => {
                      document
                        .getElementById(item.anchor)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}

            {/* 🔐 LOGGED IN NAV
            {isLoggedIn &&
              navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                    location.pathname === item.path
                      ? "bg-accent text-primary"
                      : "text-foreground"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))} */}
          </nav>

          {/* Desktop Nav */}
          {/* {isLoggedIn && ( */}
          {((user?.role_id === 3 && isLoggedIn) ||
            (user?.role_id === 4 &&
              isLoggedIn &&
              user?.provider?.verified === "verified")) && (
              <nav className="hidden items-center gap-1 lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (item.path === "/search") {
                        clearAllBookingState();
                      }
                    }}
                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${location.pathname === item.path
                      ? "bg-accent text-primary"
                      : "text-foreground"
                      }`}
                  >
                    {t(item.labelKey)}

                    {/* ✅ Show red dot only for Messages if user.isUnread */}
                    {item?.labelKey === "messages" && user?.isUnread && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </Link>
                ))}
              </nav>
            )}

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {/* <Globe size={16} /> */}
                <span className="hidden sm:inline">{currentLang}</span>
                <ChevronDown size={14} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${currentLang === lang
                        ? "text-primary font-medium"
                        : "text-foreground"
                        }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isLoggedIn && (
              <button
                onClick={() => setActiveModal("admin")}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Shield size={15} />
              </button>
            )}

            {isLoggedIn ? (
              <div
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative"
              >
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-sm font-bold"
                >
                  {user?.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${user.profile_image}`}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(user) || "U"
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                    <Link
                      to={
                        userRole === ROLE_MAP.provider
                          ? "/provider/profile"
                          : "/profile"
                      }
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <User size={14} /> {t("profile")}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                    >
                      <LogOut size={14} /> {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAuth("customer")}
                >
                  {t("findProviders")}
                </Button>
                <Button size="sm" onClick={() => handleOpenAuth("provider")}>
                  {t("becomeProvider")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-card md:hidden">
            <nav className="container-grid flex flex-col gap-1 py-4">
              {isLoggedIn ? (
                navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (item.path === "/search") {
                        clearAllBookingState();
                      }
                      setMobileOpen(false);
                    }}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent ${location.pathname === item.path
                      ? "bg-accent text-primary"
                      : "text-foreground"
                      }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                ))
              ) : (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {t("home")}
                  </Link>
                  {!isHow
                    ? landingNav.map((item) => (
                        <button
                          key={item.anchor}
                          onClick={() => {
                            setMobileOpen(false);
                            navigate("/how-it-works", {
                              state: { scrollTo: item.anchor },
                            });
                          }}
                          className="w-full text-left rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                        >
                          {item.label}
                        </button>
                      ))
                    : landingNav1.map((item) => (
                        <button
                          key={item.anchor}
                          onClick={() => {
                            setMobileOpen(false);
                            document
                              .getElementById(item.anchor)
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full text-left rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                        >
                          {item.label}
                        </button>
                      ))}
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <Shield size={15} /> Admin
                  </Link>
                </>
              )}
              <hr className="my-2 border-border" />
              <div className="flex items-center gap-2 px-3">
                <Globe size={16} className="text-muted-foreground" />
                <select
                  value={currentLang}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 flex gap-2 px-3">
                {isLoggedIn ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setMobileOpen(false);
                        navigate(
                          userRole === ROLE_MAP.provider
                            ? "/provider/profile"
                            : "/profile",
                        );
                      }}
                    >
                      {t("profile")}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={handleLogout}
                    >
                      {t("logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setMobileOpen(false);
                        handleOpenAuth("customer");
                      }}
                    >
                      {t("findProviders")}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setMobileOpen(false);
                        handleOpenAuth("provider");
                      }}
                    >
                      {t("becomeProvider")}
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        open={activeModal === "auth"}
        onClose={() => setActiveModal(null)}
        onOpenForgot={() => setActiveModal("forgot")} // 🔥 direct switch
        defaultRole={authDefaultRole}
        onLogin={(roleId) => handleLogin(roleId)}
      />
      <AdminLoginModal
        open={activeModal === "admin"}
        onClose={() => setActiveModal(null)}
      />

      <ForgotPasswordModal
        roleId={userRole} // Add only RoleId
        open={activeModal === "forgot"}
        onClose={() => setActiveModal(null)}
        onSuccess={() => setActiveModal("auth")}
      />
    </>
  );
};

export default Header;
