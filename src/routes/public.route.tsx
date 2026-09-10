import { lazy } from "react";
import { Route } from "react-router-dom";
import { routeMap } from "./routeMap";
import HomeRoute from "./HomeRoute";
import ProtectedRoute from "./ProtectedRoute";
import PublicLayout from "@/components/layout/PublicLayout";

// Public pages
const Index = lazy(() => import("@/pages/public/Home"));
const About = lazy(() => import("@/pages/public/About"));
const HowItWorks = lazy(() => import("@/pages/public/HowItWorks"));
const SearchProviders = lazy(() => import("@/pages/public/SearchProviders"));

// Auth pages
const Login = lazy(() => import("@/pages/auth/Login"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));

// Provider onboarding & profile
const ProviderOnboarding = lazy(() => import("@/pages/provider/ProviderOnboarding"));
const ProviderProfile = lazy(() => import("@/pages/provider/ProviderProfile"));

// Booking pages
const CleaningBookingWizard = lazy(() => import("@/pages/booking/CleaningBookingWizard"));
const CarWashBookingWizard = lazy(() => import("@/pages/booking/CarWashBookingWizard"));
const BookService = lazy(() => import("@/pages/booking/BookService"));
const Checkout = lazy(() => import("@/pages/booking/Checkout"));
const RatingPage = lazy(() => import("@/pages/booking/RatingPage"));

export const PublicRoutes = () => (
  <>
    {/* Public Layout Routes (Persistent Header + Footer) */}
    <Route element={<PublicLayout />}>
      {/* Marketing / Informational (Redirects authenticated users to their portal) */}
      <Route element={<HomeRoute />}>
        <Route path={routeMap.HOME.path} element={<Index />} />
        <Route path={routeMap.HOW_IT_WORKS.path} element={<HowItWorks />} />
      </Route>

      {/* General Public Pages */}
      <Route path={routeMap.ABOUT.path} element={<About />} />
      <Route path={routeMap.PROVIDER_PROFILE.path} element={<ProviderProfile />} />

      {/* Booking Flow */}
      <Route path={routeMap.BOOKING_CLEANING.path} element={<CleaningBookingWizard />} />
      <Route path={routeMap.BOOKING_CARWASH.path} element={<CarWashBookingWizard />} />
      <Route path={routeMap.BOOK_PROVIDER.path} element={<BookService />} />
      <Route path={routeMap.BOOKING_DETAIL.path} element={<BookService />} />
      <Route path={routeMap.CHECKOUT.path} element={<Checkout />} />
      <Route path={routeMap.RATING.path} element={<RatingPage />} />

      {/* Protected search route with public layout */}
      <Route element={<ProtectedRoute />}>
        <Route path={routeMap.SEARCH.path} element={<SearchProviders />} />
      </Route>
    </Route>

    {/* Guest-only Auth Routes (Redirects authenticated users, standalone layout) */}
    <Route element={<HomeRoute />}>
      <Route path={routeMap.LOGIN.path} element={<Login />} />
      <Route path={routeMap.REGISTER.path} element={<SignUp />} />
      <Route path={routeMap.FORGOT_PASSWORD.path} element={<ForgotPassword />} />
      <Route path={routeMap.RESET_PASSWORD.path} element={<ForgotPassword />} />
    </Route>

    {/* Verification & Onboarding */}
    <Route path={routeMap.VERIFY_EMAIL.path} element={<VerifyEmail />} />
    <Route path={routeMap.VERIFY_OTP.path} element={<VerifyEmail />} />
    <Route path={routeMap.PROVIDER_ONBOARDING.path} element={<ProviderOnboarding />} />
  </>
);

export default PublicRoutes;
