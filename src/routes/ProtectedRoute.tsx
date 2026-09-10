import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";

const ProtectedRoute = ({ children }: { children?: JSX.Element }) => {
  const location = useLocation();
  const { isAuthenticated, isHydrated } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  if (!isHydrated && !hasToken) {
    // Storage may hydrate on next tick; prefer token as immediate source of truth
  }

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

  return children ?? <Outlet />;
};

export default ProtectedRoute;
