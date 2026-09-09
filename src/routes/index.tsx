import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoutes from "./public.route";
import PrivateRoutes from "./private.route";
import { LoadingScreen } from "@/components/shared/primitives";
import { routeMap } from "./routeMap";

const NotFound = lazy(() => import("@/pages/shared/NotFound"));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        {PublicRoutes()}

        {/* Private / Protected Routes */}
        {PrivateRoutes()}

        {/* 404 Route */}
        <Route path={routeMap.NOT_FOUND.path} element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export * from "./routeMap";
export * from "./public.route";
export * from "./private.route";
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as HomeRoute } from "./HomeRoute";
export default AppRoutes;
