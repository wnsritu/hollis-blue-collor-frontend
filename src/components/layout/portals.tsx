import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Tags,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  DashboardShell,
  type NavItem,
} from "@/components/layout/DashboardShell";
import { Logo } from "@/components/shared/primitives";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/useAuth";
import { providerApi } from "@/api/modules/provider.api";
import { customerApi } from "@/api/modules/customer.api";
import { userApi } from "@/api/modules/user.api";
import { resolveMediaUrl } from "@/utils/mediaUrl";

function checkIsVerified(verifiedRaw: unknown, statusRaw: unknown): boolean {
  if (verifiedRaw === true || verifiedRaw === 1) return true;
  const dbVerified = String(verifiedRaw || "").toLowerCase().trim();
  const status = String(statusRaw || "").toLowerCase().trim();

  if (dbVerified === "verified" || dbVerified === "approved") return true;
  if (
    status === "profile_completed" ||
    status === "admin_approved_profile_incomplete"
  )
    return true;

  return false;
}

function ProviderRestrictedState({
  profile,
  user,
  onRefresh,
  onSignOut,
  refreshing,
}: {
  profile: any;
  user: any;
  onRefresh: () => void;
  onSignOut: () => void;
  refreshing: boolean;
}) {
  const dbVerified = String(
    profile?.verified || (user as any)?.provider?.verified || ""
  )
    .toLowerCase()
    .trim();
  const isRejected = dbVerified === "rejected";
  const rejectionReason = profile?.rejection_reason;
  const businessName =
    profile?.business_name ||
    (user as any)?.provider?.business_name ||
    "Provider Business";
  const fullName = user?.full_name || profile?.user?.full_name || "Applicant";
  const email = user?.email || profile?.user?.email || "";

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between px-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
              <Lock size={12} /> Verification Restricted
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Restricted Card */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 text-center shadow-xl transition-all sm:p-8">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-muted/60 shadow-inner">
            {isRejected ? (
              <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <XCircle size={36} />
              </div>
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl bg-warning/10 text-warning">
                <ShieldAlert size={36} />
              </div>
            )}
          </div>

          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {isRejected
              ? "Application Not Approved"
              : "Account Pending Admin Verification"}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {isRejected
              ? "Your provider account application was reviewed and could not be approved at this time. Access to normal provider panel features remains restricted."
              : "Your provider application has been submitted and is under review by our administration team. You cannot access the Provider Panel features until approved."}
          </p>

          {isRejected && rejectionReason && (
            <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-left text-xs text-destructive">
              <strong className="mb-1 block font-semibold">
                Reason for Rejection:
              </strong>
              <p>{rejectionReason}</p>
            </div>
          )}

          {/* Account & Status Summary */}
          <div className="mt-6 space-y-2.5 rounded-2xl border border-border/80 bg-muted/30 p-4 text-left text-xs text-muted-foreground sm:p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="font-semibold text-foreground">Business:</span>
              <span className="font-medium text-foreground">{businessName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="font-semibold text-foreground">Applicant:</span>
              <span className="text-foreground">{fullName}</span>
            </div>
            {email && (
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-semibold text-foreground">Email:</span>
                <span className="text-foreground">{email}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-foreground">Status:</span>
              {isRejected ? (
                <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 font-bold text-destructive">
                  Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 font-bold text-warning">
                  <Clock size={12} /> Pending Admin Approval
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              className="w-full gap-2 sm:w-auto"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Checking Status..." : "Check Approval Status"}
            </Button>

            <Button
              variant="outline"
              onClick={onSignOut}
              className="w-full gap-2 sm:w-auto"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/** Service-connect provider nav — Hollis route aliases where needed. */
export const providerNav: NavItem[] = [
  { to: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/provider/pricing", label: "Services & Pricing", icon: Tags },
  { to: "/provider/availability", label: "Availability", icon: CalendarDays },
  { to: "/provider/orders", label: "Schedule", icon: CalendarDays },
  { to: "/provider/orders", label: "Custom Requests", icon: ListChecks },
  { to: "/provider/orders", label: "Active Jobs", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/provider/earnings", label: "Earnings", icon: Wallet },
  { to: "/provider/featured", label: "Subscription", icon: CreditCard },
  { to: "/provider/featured", label: "Featured Listings", icon: Sparkles },
  { to: "/provider/profile", label: "Business Profile", icon: BadgeCheck },
];

/** Service-connect customer nav — mapped to Hollis routes. */
export const customerNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Find a Pro", icon: Search },
  { to: "/orders", label: "My Bookings", icon: Briefcase },
  { to: "/orders", label: "Custom Requests", icon: PlusCircle },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/orders", label: "Payments", icon: CreditCard },
  { to: "/dashboard", label: "Reviews", icon: Star },
  { to: "/profile", label: "My Profile", icon: User },
];

const pick = (nav: NavItem[], labels: string[]) =>
  labels
    .map((l) => nav.find((n) => n.label === l))
    .filter((n): n is NavItem => Boolean(n));

function unwrapData<T = unknown>(res: unknown): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return ((res as { data: T }).data ?? res) as T;
  }
  return res as T;
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Provider portal shell — sidebar + top bar from service-connect.
 */
export function ProviderPortal({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout, fetchMe } = useAuthSession();
  const [accountName, setAccountName] = useState(
    user?.full_name || "Provider"
  );
  const [accountRole, setAccountRole] = useState("Professional");
  const [fetchedAvatarUrl, setFetchedAvatarUrl] = useState<string | undefined>();
  const [providerProfile, setProviderProfile] = useState<any>(
    (user as any)?.provider || null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async (isManualCheck = false) => {
    if (isManualCheck) setRefreshing(true);
    try {
      const res = await providerApi.getMyMarketplaceProfile();
      const p = unwrapData<any>(res);
      if (p) {
        setProviderProfile(p);
        const name =
          p.business_name ||
          p.user?.full_name ||
          user?.full_name ||
          "Provider";
        const loc = [p.city, p.state].filter(Boolean).join(", ");
        setAccountName(name);
        setAccountRole(loc ? `Professional · ${loc}` : "Professional");
        const photo =
          p.user?.profile_image || p.profile_photo || (user as any)?.profile_image || (user as any)?.profile_photo;
        if (photo) {
          setFetchedAvatarUrl(resolveMediaUrl(String(photo)) || undefined);
        }
      }
      await fetchMe();

      if (isManualCheck) {
        const verified = checkIsVerified(
          p?.verified || (user as any)?.provider?.verified,
          p?.onboarding_status || user?.onboarding_status
        );
        if (verified) {
          toast.success(
            "Your provider account has been verified! Welcome to the Provider Panel."
          );
        } else {
          toast.error(
            "Your profile is still pending admin verification. Please check back later."
          );
        }
      }
    } catch {
      if (user?.full_name) setAccountName(user.full_name);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.full_name, (user as any)?.profile_image, (user as any)?.profile_photo]);

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isVerified = checkIsVerified(
    providerProfile?.verified || (user as any)?.provider?.verified,
    providerProfile?.onboarding_status || user?.onboarding_status
  );

  if (!loading && !isVerified) {
    return (
      <ProviderRestrictedState
        profile={providerProfile}
        user={user}
        onRefresh={() => fetchProfile(true)}
        onSignOut={handleSignOut}
        refreshing={refreshing}
      />
    );
  }

  const userPhoto = (user as any)?.profile_image || (user as any)?.profile_photo;
  const avatarUrl = resolveMediaUrl(userPhoto) || fetchedAvatarUrl;

  return (
    <DashboardShell
      nav={providerNav}
      bottomNav={pick(providerNav, [
        "Dashboard",
        "Custom Requests",
        "Active Jobs",
        "Messages",
        "Earnings",
      ])}
      title="Provider Portal"
      accountName={accountName}
      accountRole={accountRole}
      avatarUrl={avatarUrl}
      profileLink="/provider/profile"
      onSignOut={handleSignOut}
      accountInitials={initialsFrom(accountName)}
    >
      {children}
    </DashboardShell>
  );
}

/**
 * Customer portal shell — sidebar + top bar from service-connect.
 */
export function CustomerPortal({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthSession();
  const [accountName, setAccountName] = useState(
    user?.full_name || "Customer"
  );
  const [accountRole, setAccountRole] = useState("Customer");
  const [fetchedAvatarUrl, setFetchedAvatarUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let profile: any = null;
        try {
          profile = unwrapData(await customerApi.getMyProfile());
        } catch {
          profile = unwrapData(await userApi.getMyProfile());
        }
        if (cancelled || !profile) return;

        const name =
          profile.full_name ||
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          user?.full_name ||
          "Customer";
        const loc = [profile.city, profile.state].filter(Boolean).join(", ");
        setAccountName(name);
        setAccountRole(loc ? `Customer · ${loc}` : "Customer");

        const photo =
          profile.profile_image ||
          profile.profile_photo ||
          (user as any)?.profile_image ||
          (user as any)?.profile_photo;
        if (photo) {
          setFetchedAvatarUrl(resolveMediaUrl(String(photo)) || undefined);
        }
      } catch {
        if (!cancelled && user?.full_name) setAccountName(user.full_name);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.full_name, (user as any)?.profile_image, (user as any)?.profile_photo]);

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const userPhoto = (user as any)?.profile_image || (user as any)?.profile_photo;
  const avatarUrl = resolveMediaUrl(userPhoto) || fetchedAvatarUrl;

  return (
    <DashboardShell
      nav={customerNav}
      bottomNav={pick(customerNav, [
        "Dashboard",
        "My Bookings",
        "Custom Requests",
        "Messages",
        "My Profile",
      ])}
      title="Customer Portal"
      accountName={accountName}
      accountRole={accountRole}
      avatarUrl={avatarUrl}
      profileLink="/profile"
      onSignOut={handleSignOut}
      accountInitials={initialsFrom(accountName)}
    >
      {children}
    </DashboardShell>
  );
}

/** Pick portal by role — useful for shared routes like /messages. */
export function RolePortal({ children }: { children: ReactNode }) {
  const { isProvider } = useAuthSession();
  if (isProvider) return <ProviderPortal>{children}</ProviderPortal>;
  return <CustomerPortal>{children}</CustomerPortal>;
}

export default ProviderPortal;
