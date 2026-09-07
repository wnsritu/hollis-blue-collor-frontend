import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  AlertTriangle,
  Star,
  Coins,
  Settings,
  ShieldCheck,
  DollarSign,
  LayoutGrid,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { getMyProfile } from "@/services/user.service";
import { useAuthSession } from "@/hooks/useAuth";
import { resolveMediaUrl } from "@/utils/mediaUrl";

const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Services", to: "/admin/services", icon: LayoutGrid },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Providers", to: "/admin/providers", icon: Building2 },
  { label: "Orders", to: "/admin/orders", icon: ClipboardList },
  { label: "Disputes", to: "/admin/disputes", icon: AlertTriangle },
  { label: "Sponsored Listings", to: "/admin/sponsored", icon: Star },
  { label: "Coins Management", to: "/admin/coins", icon: Coins },
  { label: "Featured Pricing", to: "/admin/featured", icon: DollarSign },
  { label: "Support Agents", to: "/admin/support-agents", icon: ShieldCheck },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
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
      title="Platform Admin"
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
