import { useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";

const supportNav: NavItem[] = [
  { label: "Dashboard", to: "/support-dashboard", icon: LayoutDashboard },
  { label: "Messages / Photos", to: "/support-dashboard/messages", icon: MessageSquare },
  { label: "Provider Profiles", to: "/support-dashboard/providers", icon: Users },
  { label: "Disputes", to: "/support-dashboard/disputes", icon: AlertTriangle },
  { label: "Settings", to: "/support-dashboard/settings", icon: Settings },
];

const SupportAgentLayout = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <DashboardShell
      nav={supportNav}
      title="Support Portal"
      accountName="Support Agent"
      accountRole="Support Team"
      profileLink="/support-dashboard/settings"
      onSignOut={handleSignOut}
    >
      <Outlet />
    </DashboardShell>
  );
};

export default SupportAgentLayout;
