import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getMyProfile } from "@/services/user.service";
import { Logo, Avatar } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const links = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Find a Professional" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/provider/onboarding", label: "Become a Pro" },
] as const;

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, roleId, logout, user } = useAuthSession();

  const isLoggedIn = isAuthenticated;
  const isProviderUser = Number(roleId) === ROLES.PROVIDER;
  const isCustomerUser = Number(roleId) === ROLES.CUSTOMER;

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyProfile();
        if (!cancelled) setProfile(res.data);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, location.pathname, user?.id]);

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await logout();
    navigate("/");
  };

  const getInitials = (u: any) => {
    if (!u) return "U";
    if (u.full_name) {
      const parts = String(u.full_name).trim().split(/\s+/);
      return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
    }
    const first = u.first_name?.[0] || "";
    const last = u.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const dashboardRoute = isProviderUser
    ? "/provider/dashboard"
    : isCustomerUser
      ? "/dashboard"
      : Number(roleId) === ROLES.SUPPORT
        ? "/support-dashboard"
        : "/admin";

  const displayUser = user || profile;
  const rawPhoto =
    (user as any)?.profile_image ||
    (user as any)?.profile_photo ||
    profile?.profile_image ||
    profile?.profile_photo;
  const avatarUrl = resolveMediaUrl(rawPhoto);

  return (
    <header
      className={cn(
        "sticky z-50 border-b border-border/80 bg-background/95 backdrop-blur-md transition-all duration-300",
        isAtTop ? "top-0 sm:top-0" : "top-0 sm:top-4"
      )}
    >
      <div className="container-page flex h-14 w-full items-center justify-between md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4">
        <Logo overhanging isAtTop={isAtTop} />

        <nav className="hidden min-w-0 items-center justify-center gap-2 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                location.pathname === l.to.split("?")[0]
                  ? "bg-muted font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="hidden sm:inline-flex rounded-full px-5">
                <Link to={dashboardRoute}>Dashboard</Link>
              </Button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex size-9 items-center justify-center overflow-hidden rounded-full transition-transform hover:scale-105"
                  aria-label="User menu"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Avatar initials={getInitials(displayUser)} size="sm" />
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-card z-50">
                    <Link
                      to={isProviderUser ? "/provider/profile" : "/profile"}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <User size={14} /> Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive-soft transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex text-sm font-medium"
              >
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex rounded-full px-5">
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm p-6">
              <div className="mt-8 flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-3 text-base font-medium hover:bg-secondary"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 grid gap-2">
                {!isLoggedIn ? (
                  <>
                    <Button asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/register">Get started</Link>
                    </Button>
                    <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/login">Log in</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild onClick={() => setMobileOpen(false)}>
                      <Link to={dashboardRoute}>Dashboard</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setMobileOpen(false);
                        void handleLogout();
                      }}
                    >
                      Log out
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
