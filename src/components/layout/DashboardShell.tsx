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
  exact?: boolean;
  matchPaths?: string[];
  children?: { to: string; label: string; exact?: boolean; matchPaths?: string[] }[];
};

/**
 * Computes a match score for a target URL against current pathname.
 * - Exact match: 1000 + target.length
 * - Boundary-aware prefix match (/section/...): 100 + target.length
 * - No match: 0
 */
export function getPathMatchScore(pathname: string, target: string, exact = false): number {
  if (!pathname || !target) return 0;
  const normPath = pathname.replace(/\/+$/, "") || "/";
  const normTarget = target.replace(/\/+$/, "") || "/";

  if (normPath === normTarget) {
    return 1000 + normTarget.length;
  }

  // Exact flag or root path "/" must match exactly to avoid wildcard root matches
  if (exact || normTarget === "/") {
    return 0;
  }

  // Segment boundary check: /parent matches /parent/child, but not /parent-other
  if (normPath.startsWith(`${normTarget}/`)) {
    return 100 + normTarget.length;
  }

  return 0;
}

/**
 * Computes the maximum match score for a NavItem (including its matchPaths and any children).
 */
export function getItemMatchScore(
  pathname: string,
  item: { to: string; exact?: boolean; matchPaths?: string[]; children?: { to: string; exact?: boolean; matchPaths?: string[] }[] },
): number {
  const allTargets = [item.to, ...(item.matchPaths || [])];
  let maxScore = 0;

  for (const target of allTargets) {
    const score = getPathMatchScore(pathname, target, item.exact);
    if (score > maxScore) {
      maxScore = score;
    }
  }

  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      const childTargets = [child.to, ...(child.matchPaths || [])];
      for (const target of childTargets) {
        const score = getPathMatchScore(pathname, target, child.exact);
        if (score > maxScore) {
          maxScore = score;
        }
      }
    }
  }

  return maxScore;
}

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

  // Score all nav items against current pathname
  const itemScores = nav.map((item) => getItemMatchScore(pathname, item));
  const maxScore = Math.max(0, ...itemScores);

  // Highest-scoring item wins active highlight
  const isItemActive = (index: number) => maxScore > 0 && itemScores[index] === maxScore;

  // Score bottom navigation items
  const bottomScores = (bottomNav || []).map((item) => getItemMatchScore(pathname, item));
  const maxBottomScore = Math.max(0, ...bottomScores);
  const isBottomItemActive = (index: number) =>
    maxBottomScore > 0 && bottomScores[index] === maxBottomScore;

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item, index) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const active = isItemActive(index);

        if (hasChildren) {
          return (
            <CollapsibleNavItem
              key={`${item.to}-${item.label}`}
              item={item}
              pathname={pathname}
              isParentActive={active}
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
          {bottomNav.map((item, index) => {
            const active = isBottomItemActive(index);
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
  isParentActive,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  isParentActive: boolean;
  onNavigate?: () => void;
}) {
  const childScores = (item.children || []).map((c) => {
    const allTargets = [c.to, ...(c.matchPaths || [])];
    return Math.max(0, ...allTargets.map((t) => getPathMatchScore(pathname, t, c.exact)));
  });
  const maxChildScore = Math.max(0, ...childScores);
  const isChildActive = maxChildScore > 0;
  const [expanded, setExpanded] = useState(isChildActive || isParentActive);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
          isParentActive || isChildActive
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
          {item.children?.map((child, cIdx) => {
            const active = isChildActive && childScores[cIdx] === maxChildScore;
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
