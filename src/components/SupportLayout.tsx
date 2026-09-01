import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Users,
  CreditCard,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Shield,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { label: "Dashboard", path: "/support-dashboard", icon: LayoutDashboard },

  {
    label: "Messages / Photos",
    path: "/support-dashboard/messages",
    icon: MessageSquare,
  },

  {
    label: "Provider Profiles",
    path: "/support-dashboard/providers",
    icon: Users,
  },

  // {
  //   label: "Refund Requests",
  //   path: "/support-dashboard/refunds",
  //   icon: CreditCard,
  // },

  // ✅ FIX
  {
    label: "Disputes",
    path: "/support-dashboard/disputes",
    icon: AlertTriangle,
  },

  { label: "Settings", path: "/support-dashboard/settings", icon: Settings },
];

const SupportAgentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const [open, setOpen] = useState(false);


    const handleLogout = () => {
      localStorage.removeItem("userRole");
      localStorage.removeItem("token");
      navigate("/");
    };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00ba88] text-white text-base font-bold">
            S
          </span>
          <span className="font-heading text-lg font-bold text-foreground">
            Support Agent
          </span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
              >
              <div
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${active ? "bg-[#e8faf4] text-[#00ba88] font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"}`}
              >
                <item.icon size={18} />
                {item.label}
              </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut size={18} /> Back to Site
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <header className="relative z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-foreground" />
          </button>
          <Badge className="border-0 bg-[#e8faf4] text-[#00ba88] font-medium px-3 py-1 rounded-full flex items-center">
            <span className="inline-block w-2 h-2 rounded-full border-2 border-[#00ba88] mr-1.5" /> Support Agent
          </Badge>
          <div className="relative">
            {/* Avatar */}
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00ba88] text-white text-xs font-bold">
                SA
              </span>
            </div>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-lg border p-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-500 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 min-w-0 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SupportAgentLayout;
