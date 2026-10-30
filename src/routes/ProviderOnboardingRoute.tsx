import { Navigate, Outlet } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";
import { ROLES } from "@/constants/roles";

export interface ProviderOnboardingRouteProps {
  children?: JSX.Element;
}

/**
 * Route guard for /provider/onboarding.
 * - Unauthenticated visitors: Allowed (applying to become a provider).
 * - Providers with incomplete setup: Allowed.
 * - Completed Providers: Redirect to /provider/dashboard.
 * - Customers: Redirect to /dashboard.
 * - Admin/Support: Redirect to /admin or /support-dashboard.
 */
export const ProviderOnboardingRoute = ({
  children,
}: ProviderOnboardingRouteProps) => {
  const { isAuthenticated, roleId, user } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  if (isAuthenticated || hasToken) {
    const currentRoleId = Number(roleId ?? user?.role_id ?? tokenStorage.getRoleId());
    if (currentRoleId === ROLES.CUSTOMER) {
      return <Navigate to="/dashboard" replace />;
    }
    if (currentRoleId === ROLES.ADMIN) {
      return <Navigate to="/admin" replace />;
    }
    if (currentRoleId === ROLES.SUPPORT) {
      return <Navigate to="/support-dashboard" replace />;
    }
    if (currentRoleId === ROLES.PROVIDER) {
      const profileDone =
        user?.is_profile_setup === true || user?.is_profile_setup === 1;
      if (profileDone) {
        return <Navigate to="/provider/dashboard" replace />;
      }
    }
  }

  return children ?? <Outlet />;
};

export default ProviderOnboardingRoute;

