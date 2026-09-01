import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, Users, ClipboardList, AlertTriangle, Star,
  Coins, MessageSquare, Settings, LogOut, Bell, ChevronDown,
  Menu, X, User, Shield,
  ShieldCheck,
  Headphones,
  DollarSign,
  LayoutGrid,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockNotifications } from "@/pages/admin/AdminNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMyProfile } from "@/services/user.service";

const adminRole: string = "Super Admin";

const sidebarItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    restricted: false,
  },
  {
    label: "Services",
    path: "/admin/services",
    icon: LayoutGrid,
    restricted: false,
  },
  {
    label: "Providers",
    path: "/admin/providers",
    icon: Users,
    restricted: false,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ClipboardList,
    restricted: false,
  },
  {
    label: "Disputes",
    path: "/admin/disputes",
    icon: AlertTriangle,
    restricted: false,
  },
  {
    label: "Sponsored Listings",
    path: "/admin/sponsored",
    icon: Star,
    restricted: true,
  },
  {
    label: "Coins Management",
    path: "/admin/coins",
    icon: Coins,
    restricted: true,
  },
  {
    label: "Featured Pricing",
    path: "/admin/featured",
    icon: DollarSign,
    restricted: false,
  },
  // {
  //   label: "Notifications",
  //   path: "/admin/notifications",
  //   icon: Bell,
  //   restricted: false,
  // },
  {
    label: "Support Agents",
    path: "/admin/support-agents",
    icon: ShieldCheck,
    restricted: false,
  },
  // {
  //   label: "Support Requests",
  //   path: "/admin/support-request",
  //   icon: Headphones,
  //   restricted: false,
  // },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
    restricted: false,
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isRestricted = (restricted: boolean) => adminRole === "Support Agent" && restricted;
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        setUser(res.data);
      } catch (err) {
        console.log("PROFILE ERROR", err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0 animate-slide-in-right"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            U
          </span>
          <span className="font-heading text-lg font-bold text-foreground">
            Admin Panel
          </span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/50 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {sidebarItems
            .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => {
              const active = location.pathname === item.path;
              const restricted = isRestricted(item.restricted);
              const linkContent = (
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    restricted
                      ? "cursor-not-allowed text-muted-foreground/50"
                      : active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </div>
              );

              if (restricted) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent>Permission restricted</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                >
                  {linkContent}
                </Link>
              );
            })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userRole"); // agar use kar raha hai
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut size={18} />
            Back to Site
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-foreground" />
          </button>

          {/* Role Badge */}
          <div className="hidden lg:flex items-center gap-2">
            <Badge className="border-0 bg-primary/10 text-primary">
              <Shield size={12} className="mr-1" /> {adminRole}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            {/* <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-border bg-card shadow-lg animate-fade-in z-50">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      Notifications
                    </p>
                    <button className="text-xs text-primary hover:underline">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {mockNotifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 text-sm border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                      >
                        <div
                          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`}
                        />
                        <div>
                          <p
                            className={`${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}
                          >
                            {n.message}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {n.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border p-2">
                    <Link
                      to="/admin/notifications"
                      onClick={() => setNotifOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary"
                      >
                        View all notifications
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div> */}

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold overflow-hidden">
                  {user?.profile_image ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${user.profile_image}`}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : user?.first_name ? (
                    `${user.first_name[0]}${user.last_name?.[0] || ""}`.toUpperCase()
                  ) : (
                    "AD"
                  )}
                </span>
                <span className="hidden text-foreground sm:inline">Admin</span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg animate-fade-in">
                  <Link
                    to="/admin/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <User size={14} /> Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      localStorage.removeItem("userRole");
                      localStorage.removeItem("token");
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
