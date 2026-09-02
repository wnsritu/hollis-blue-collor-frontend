import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Sparkles,
  Tags,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  DashboardShell,
  type NavItem,
} from "@/components/layout/DashboardShell";
import { useAuthSession } from "@/hooks/useAuth";
import { providerApi } from "@/api/modules/provider.api";
import { resolveMediaUrl } from "@/utils/mediaUrl";

/**
 * Service-connect provider nav — Hollis routes (aliases until dedicated pages exist).
 */
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
  if (!parts.length) return "PR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Provider portal shell — sidebar + top bar from service-connect DashboardShell.
 */
export function ProviderPortal({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthSession();
  const [accountName, setAccountName] = useState(
    user?.full_name || "Provider"
  );
  const [accountRole, setAccountRole] = useState("Professional");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await providerApi.getMyMarketplaceProfile();
        const p = unwrapData<any>(res);
        if (cancelled || !p) return;
        const name =
          p.business_name ||
          p.user?.full_name ||
          user?.full_name ||
          "Provider";
        const loc = [p.city, p.state].filter(Boolean).join(", ");
        setAccountName(name);
        setAccountRole(
          loc ? `Professional · ${loc}` : "Professional"
        );
        const photo =
          p.user?.profile_image ||
          p.profile_photo ||
          user?.profile_photo;
        if (photo) {
          setAvatarUrl(resolveMediaUrl(String(photo)) || undefined);
        }
      } catch {
        if (!cancelled && user?.full_name) {
          setAccountName(user.full_name);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.full_name, user?.profile_photo]);

  const handleSignOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

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

export default ProviderPortal;
