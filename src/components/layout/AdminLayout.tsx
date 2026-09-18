import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  Gauge,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  Briefcase,
  CreditCard,
  Sparkles,
  List,
  Percent,
  Wallet,
  Star,
  Settings,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { getMyProfile } from "@/services/user.service";
import { useAuthSession } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: Gauge },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Providers", to: "/admin/providers", icon: CheckCircle2 },
  {
    label: "Category Management",
    to: "/admin/categories",
    icon: SlidersHorizontal,
    children: [
      { label: "Subcategories", to: "/admin/categories" },
      { label: "Services", to: "/admin/services" },
    ],
  },
  { label: "Service Bookings", to: "/admin/orders", icon: Briefcase },
  { label: "Subscriptions", to: "/admin/subscriptions", icon: CreditCard },
  { label: "Featured Plans", to: "/admin/featured-plans", icon: Sparkles },
  { label: "Featured Listings", to: "/admin/featured-listings", icon: List },
  { label: "Commission", to: "/admin/commission", icon: Percent },
  { label: "Payout Queue", to: "/admin/payouts", icon: Wallet },
  { label: "Reviews", to: "/admin/reviews", icon: Star },
  { label: "Reports", to: "/admin/reports", icon: Gauge },
  { label: "Platform Settings", to: "/admin/settings", icon: Settings },
];


export const AdminLayout = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuthSession();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        setUser(res.data);
      } catch (err) {
        console.log("ADMIN PROFILE ERROR", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const accountName =
    authUser?.full_name ||
    (user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : null) ||
    "Platform Admin";

  const rawPhoto =
    (authUser as any)?.profile_image ||
    (authUser as any)?.profile_photo ||
    user?.profile_image ||
    user?.profile_photo;
  const avatarUrl = resolveMediaUrl(rawPhoto) || undefined;

  return (
    <DashboardShell
      nav={adminNav}
      title="ADMIN CONSOLE"
      accountName={accountName}
      accountRole="Administrator"
      avatarUrl={avatarUrl}
      profileLink="/admin/profile"
      onSignOut={handleSignOut}
    >
      <Outlet />
    </DashboardShell>
  );
};

export default AdminLayout;
