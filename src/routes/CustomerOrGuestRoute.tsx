import { Navigate, Outlet } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";
import { ROLES } from "@/constants/roles";
import { getLoggedInHomeRedirect } from "@/utils/postLoginNavigation";

export interface CustomerOrGuestRouteProps {
  children?: JSX.Element;
}

/**
 * Route guard for marketplace discovery routes (e.g., /search, /provider/:id).
 * - Unauthenticated visitors (Guests): Allowed to browse.
 * - Logged-in Customers: Allowed to browse and book services.
 * - Logged-in Providers, Admins, Support: Blocked and redirected to their respective role portal.
 */
export const CustomerOrGuestRoute = ({ children }: CustomerOrGuestRouteProps) => {
  const { isAuthenticated, roleId, user } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  if (isAuthenticated || hasToken) {
    const currentRoleId = Number(roleId ?? user?.role_id ?? tokenStorage.getRoleId());
    // Only customer is permitted among logged-in accounts
    if (currentRoleId && currentRoleId !== ROLES.CUSTOMER) {
      const dest = getLoggedInHomeRedirect(user);
      return <Navigate to={dest} replace />;
    }
  }

  return children ?? <Outlet />;
};

export default CustomerOrGuestRoute;

