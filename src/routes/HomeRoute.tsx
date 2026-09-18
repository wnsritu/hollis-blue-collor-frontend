import { Navigate, Outlet } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";
import { getLoggedInHomeRedirect } from "@/utils/postLoginNavigation";

/**
 * Route guard for the home page (/).
 * If a user is logged in (customer, provider, admin, support),
 * they cannot access the home page until they log out.
 * They are automatically redirected to their respective dashboard/portal.
 */
const HomeRoute = ({ children }: { children?: JSX.Element }) => {
  const { isAuthenticated, user } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  if (isAuthenticated || hasToken) {
    const dest = getLoggedInHomeRedirect(user);
    return <Navigate to={dest} replace />;
  }

  return children ?? <Outlet />;
};

export default HomeRoute;
