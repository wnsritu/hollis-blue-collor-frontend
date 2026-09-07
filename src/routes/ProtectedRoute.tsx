import { Navigate, useLocation } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";
import { tokenStorage } from "@/utils/tokenStorage";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const { isAuthenticated, isHydrated } = useAuthSession();
  const hasToken = Boolean(tokenStorage.getAccessToken());

  if (!isHydrated && !hasToken) {
    // Storage may hydrate on next tick; prefer token as immediate source of truth
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
