import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo, Avatar } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  restricted?: boolean;
  children?: { to: string; label: string }[];
};

export function DashboardShell({
  nav,
  bottomNav,
  title,
  accountName,
  accountRole,
  avatarUrl,
  accountInitials,
  profileLink = "/profile",
  onSignOut,
  children,
}: {
  nav: NavItem[];
  bottomNav?: NavItem[];
  title: string;
  accountName: string;
  accountRole: string;
  avatarUrl?: string;
  accountInitials?: string;
  profileLink?: string;
  onSignOut?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const userInitials =
    accountInitials || accountName.slice(0, 2).toUpperCase() || "US";

  const isActivePath = (to: string) => {
    if (pathname === to) return true;
    if (pathname.startsWith(`${to}/`)) return true;
    // Order detail lives under /provider/order/:id
    if (to === "/provider/orders" && pathname.startsWith("/provider/order/")) {
      return true;
    }
    return false;
  };

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isChildActive = hasChildren
          ? item.children!.some((c) => isActivePath(c.to))
          : false;
        const active = isActivePath(item.to) || isChildActive;

        if (hasChildren) {
          return (
            <CollapsibleNavItem
              key={`${item.to}-${item.label}`}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <Link
            key={`${item.to}-${item.label}`}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon size={17} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar — service-connect structure */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <div className="flex w-full items-center justify-center pt-1">
          <Logo
            imgClassName="h-[48px] max-h-[48px] mt-0"
            className="mt-0 justify-center"
          />
        </div>
        <p className="mt-3 mb-2 px-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <NavList />
        </div>
        <div className="mt-4 rounded-2xl border border-sidebar-border bg-card p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={accountName}
                className="size-9 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <Avatar initials={userInitials} size="sm" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{accountName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {accountRole}
              </p>
            </div>
          </div>
          {onSignOut && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onSignOut}
            >
              <LogOut size={15} /> Sign out
            </Button>
          )}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu size={18} />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex w-[82vw] max-w-xs flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex w-full items-center justify-center pt-1">
                      <Logo
                        imgClassName="h-[48px] max-h-[48px] mt-0"
                        className="mt-0 justify-center"
                      />
                    </div>
                    <p className="mt-3 mb-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {title}
                    </p>
                    <div className="max-h-[60vh] overflow-y-auto">
                      <NavList onNavigate={() => setOpen(false)} />
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-sidebar-border bg-card p-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={accountName}
                          className="size-9 shrink-0 rounded-2xl object-cover"
                        />
                      ) : (
                        <Avatar initials={userInitials} size="sm" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {accountName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {accountRole}
                        </p>
                      </div>
                    </div>
                    {onSignOut && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setOpen(false);
                          onSignOut();
                        }}
                      >
                        <LogOut size={15} /> Sign out
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <span className="hidden font-display text-sm font-semibold sm:block">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                aria-label="Notifications"
              >
                <Bell size={17} />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none ring-offset-background transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={accountName}
                        className="size-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <Avatar initials={userInitials} size="sm" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link to={profileLink}>
                      <User size={15} /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  {onSignOut && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onSignOut}
                        className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut size={15} /> Sign out
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "px-4 py-6 sm:px-6 lg:px-8",
            bottomNav && "pb-24 lg:pb-8",
          )}
        >
          {children}
        </main>
      </div>

      {bottomNav && bottomNav.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-flow-col border-t border-border bg-background/95 px-2 py-1.5 backdrop-blur-md lg:hidden">
          {bottomNav.map((item) => {
            const active = isActivePath(item.to);
            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon size={19} />
                <span className="truncate">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isChildActive = Boolean(
    item.children?.some(
      (c) => pathname === c.to || pathname.startsWith(`${c.to}/`),
    ),
  );
  const [expanded, setExpanded] = useState(isChildActive);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
          isChildActive
            ? "bg-sidebar-accent/50 font-semibold text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <item.icon size={17} className="shrink-0" />
          <span className="truncate">{item.label}</span>
        </div>
        {expanded ? (
          <ChevronDown size={15} className="shrink-0" />
        ) : (
          <ChevronRight size={15} className="shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-3">
          {item.children?.map((child) => {
            const active =
              pathname === child.to || pathname.startsWith(`${child.to}/`);
            return (
              <Link
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardShell;
