import "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import PublicLayout from "./components/layout/PublicLayout";
import Index from "./pages/Index";
import SearchProviders from "./pages/SearchProviders";
import ProviderProfile from "./pages/ProviderProfile";
import Booking from "./pages/Booking";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import Messages from "./pages/Messages";
import RatingPage from "./pages/RatingPage";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerOrderDetail from "./pages/CustomerOrderDetail";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import VerifyEmail from "./pages/VerifyEmail";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderOrders from "./pages/ProviderOrders";
import ProviderOrderDetail from "./pages/ProviderOrderDetail";
import ProviderPricing from "./pages/ProviderPricing";
import ProviderAvailability from "./pages/ProviderAvailability";
import ProviderEarnings from "./pages/ProviderEarnings";
import ProviderProfileSettings from "./pages/ProviderProfileSettings";
import NotFound from "./pages/NotFound";

import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminSponsored from "./pages/admin/AdminSponsored";
import AdminCoins from "./pages/admin/AdminCoins";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminConversation from "./pages/admin/AdminConversation";
import AdminServices from "./pages/admin/AdminServices";

import ProtectedRoute from "@/routes/ProtectedRoute";
import SupportAgentsPage from "./pages/admin/SupportAgentsPage";
import SupportDashboard from "./pages/support/SupportAgent";
import SupportLayout from "./components/SupportLayout";
import SupportRequestsPage from "./pages/admin/SupportRequest";
import ProviderFeatured from "./pages/ProviderFeatured";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import AdminFeaturedPricing from "./pages/admin/AdminFeaturedPricing";
import ReportIssue from "./pages/ReportIssue";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import ScrollToTop from "@/components/ScrollToTop";
import CleaningBookingWizard from "./pages/CleaningBookingWizard";
import CarWashBookingWizard from "./pages/CarWashBookingWizard";
import SupportDisputes from "./pages/support/SupportDisputes";
import DisputeDetails from "./pages/support/SupportDisputeDetail";
import SupportProvider from "./pages/support/SupportProvider";
import SupportChats from "./pages/support/SupportChats";
import AdminDisputeDetail from "./pages/admin/AdminDisputeDetail";
import SupportDisputeDetail from "./pages/support/SupportDisputeDetail";
import SupportSettings from "./pages/support/SupportSettings";
import SupportRefundRequests from "./pages/support/SupportRefundRequests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="top-right" />
      {/* <Sonner /> */}
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ================= ADMIN ================= */}
          {/* <Route path="/admin/login" element={<AdminLogin />} /> */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="disputes/:id" element={<AdminDisputeDetail />} />
            <Route path="sponsored" element={<AdminSponsored />} />
            <Route path="coins" element={<AdminCoins />} />
            {/* <Route path="messages" element={<AdminMessages />} /> */}
            <Route path="featured" element={<AdminFeaturedPricing />} />
            <Route path="messages/:id" element={<AdminConversation />} />
            {/* <Route path="notifications" element={<AdminNotifications />} /> */}
            <Route path="profile" element={<AdminProfile />} />
            <Route
              path="/admin/support-agents"
              element={<SupportAgentsPage />}
            />
            {/* <Route
              path="/admin/support-request"
              element={<SupportRequestsPage />}
            /> */}
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route
            path="/support-dashboard"
            element={
              <ProtectedRoute>
                <SupportLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SupportDashboard />} />
            <Route path="messages" element={<SupportChats />} />
            <Route path="providers" element={<SupportProvider />} />
            <Route path="refunds" element={<SupportRefundRequests />} />
            <Route path="disputes" element={<SupportDisputes />} />
            <Route path="settings" element={<SupportSettings />} />

            <Route path="disputes/:id" element={<SupportDisputeDetail />} />
          </Route>

          {/* ================= PUBLIC ================= */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Index />
              </PublicLayout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyEmail />} />
          <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
          <Route
            path="/how-it-works"
            element={
              <PublicLayout>
                <HowItWorks />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          <Route
            path="/search"
            element={
              <PublicLayout>
                <SearchProviders />
              </PublicLayout>
            }
          />

          <Route
            path="/provider/:id"
            element={
              <PublicLayout>
                <ProviderProfile />
              </PublicLayout>
            }
          />
          <Route
            path="/booking/cleaning"
            element={
              <PublicLayout>
                <CleaningBookingWizard />
              </PublicLayout>
            }
          />
          <Route
            path="/booking/carwash"
            element={
              <PublicLayout>
                <CarWashBookingWizard />
              </PublicLayout>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <PublicLayout>
                <Booking />
              </PublicLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <PublicLayout>
                <Checkout />
              </PublicLayout>
            }
          />
          <Route
            path="/rating/:id"
            element={
              <PublicLayout>
                <RatingPage />
              </PublicLayout>
            }
          />

          {/* ================= CUSTOMER (PROTECTED) ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <CustomerDashboard />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <OrderTracking />
                  {/* <CustomerOrderDetail /> */}
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/order/:id"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <CustomerOrderDetail />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-issue/:id"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ReportIssue />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <Messages />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <CustomerProfile />
                </>
              </ProtectedRoute>
            }
          />

          {/* ================= PROVIDER (PROTECTED) ================= */}
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderDashboard />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/orders"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderOrders />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/order/:id"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderOrderDetail />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/pricing"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderPricing />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/availability"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderAvailability />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/earnings"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderEarnings />
                </>
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/featured"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderFeatured />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/profile"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <ProviderProfileSettings />
                </>
              </ProtectedRoute>
            }
          />

          {/* ================= 404 ================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
