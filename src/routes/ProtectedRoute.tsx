import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";
import { getLoggedInHomeRedirect } from "@/utils/postLoginNavigation";

export interface ProtectedRouteProps {
  children?: JSX.Element;
  allowedRoles?: number[] | readonly number[];
  redirectPath?: string;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectPath,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isHydrated, roleId, user } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  if (!isHydrated && !hasToken) {
    // Storage may hydrate on next tick; prefer token as immediate source of truth
  }

  // 1. Not authenticated -> Redirect to login with intended redirect
  if (!isAuthenticated && !hasToken) {
    const fullPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(fullPath)}`}
        replace
        state={{ from: fullPath }}
      />
    );
  }

  // 2. Role-based protection: if allowedRoles is provided, enforce it
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRoleId = Number(roleId ?? user?.role_id ?? tokenStorage.getRoleId());
    const isAllowed = allowedRoles.some((r) => Number(r) === currentRoleId);

    if (!isAllowed) {
      // Role is not authorized for this route — redirect to user's assigned dashboard
      const fallback = redirectPath || getLoggedInHomeRedirect(user);
      return <Navigate to={fallback} replace />;
    }
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
