import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { routeMap } from "./routeMap";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SupportLayout } from "@/components/layout/SupportLayout";
import { ProviderPortal, CustomerPortal, RolePortal } from "@/components/layout/portals";

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminProviders = lazy(() => import("@/pages/admin/AdminProviders"));
const AdminProviderDetail = lazy(() => import("@/pages/admin/AdminProviderDetail"));
const AdminCustomers = lazy(() => import("@/pages/admin/AdminCustomers"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminDisputes = lazy(() => import("@/pages/admin/AdminDisputes"));
const AdminDisputeDetail = lazy(() => import("@/pages/admin/AdminDisputeDetail"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminSponsored = lazy(() => import("@/pages/admin/AdminSponsored"));
const AdminCoins = lazy(() => import("@/pages/admin/AdminCoins"));
const AdminFeaturedPricing = lazy(() => import("@/pages/admin/AdminFeaturedPricing"));
const AdminConversation = lazy(() => import("@/pages/admin/AdminConversation"));
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"));
const SupportAgentsPage = lazy(() => import("@/pages/admin/SupportAgentsPage"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

// Support pages
const SupportDashboard = lazy(() => import("@/pages/support/SupportAgent"));
const SupportChats = lazy(() => import("@/pages/support/SupportChats"));
const SupportProvider = lazy(() => import("@/pages/support/SupportProvider"));
const SupportRefundRequests = lazy(() => import("@/pages/support/SupportRefundRequests"));
const SupportDisputes = lazy(() => import("@/pages/support/SupportDisputes"));
const SupportDisputeDetail = lazy(() => import("@/pages/support/SupportDisputeDetail"));
const SupportSettings = lazy(() => import("@/pages/support/SupportSettings"));

// Customer pages
const CustomerDashboard = lazy(() => import("@/pages/customer/CustomerDashboard"));
const OrderTracking = lazy(() => import("@/pages/customer/OrderTracking"));
const CustomerOrderDetail = lazy(() => import("@/pages/customer/CustomerOrderDetail"));
const ReportIssue = lazy(() => import("@/pages/customer/ReportIssue"));
const CustomerProfile = lazy(() => import("@/pages/customer/CustomerProfile"));
const CustomerProjects = lazy(() => import("@/pages/customer/CustomerProjects"));
const CustomerReviews = lazy(() => import("@/pages/customer/CustomerReviews"));

// Role-adaptive shared pages
const Messages = lazy(() => import("@/pages/shared/Messages"));
const ProjectDetail = lazy(() => import("@/pages/shared/ProjectDetail"));
const AppointmentsPage = lazy(() => import("@/pages/shared/AppointmentsPage"));

// Provider pages
const ProviderDashboard = lazy(() => import("@/pages/provider/ProviderDashboard"));
const ProviderLeads = lazy(() => import("@/pages/provider/ProviderLeads"));
const ProviderJobs = lazy(() => import("@/pages/provider/ProviderJobs"));
const ProviderOrderDetail = lazy(() => import("@/pages/provider/ProviderOrderDetail"));
const ProviderPricing = lazy(() => import("@/pages/provider/ProviderPricing"));
const ProviderAvailability = lazy(() => import("@/pages/provider/ProviderAvailability"));
const ProviderEarnings = lazy(() => import("@/pages/provider/ProviderEarnings"));
const ProviderFeatured = lazy(() => import("@/pages/provider/ProviderFeatured"));
const ProviderProfileSettings = lazy(() => import("@/pages/provider/ProviderProfileSettings"));

export const PrivateRoutes = () => (
  <>
    {/* ================= ADMIN ================= */}
    <Route
      path={routeMap.ADMIN_DASHBOARD.path}
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<AdminDashboard />} />
      <Route path="categories" element={<AdminCategories />} />
      <Route path="services" element={<AdminServices />} />
      <Route path="providers" element={<AdminProviders />} />
      <Route path="providers/:id" element={<AdminProviderDetail />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="disputes" element={<AdminDisputes />} />
      <Route path="disputes/:id" element={<AdminDisputeDetail />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="sponsored" element={<AdminSponsored />} />
      <Route path="coins" element={<AdminCoins />} />
      <Route path="featured" element={<AdminFeaturedPricing />} />
      <Route path="messages/:id" element={<AdminConversation />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="support-agents" element={<SupportAgentsPage />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>

    {/* ================= SUPPORT ================= */}
    <Route
      path={routeMap.SUPPORT_DASHBOARD.path}
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

    {/* ================= CUSTOMER PORTAL ================= */}
    <Route
      element={
        <ProtectedRoute>
          <CustomerPortal />
        </ProtectedRoute>
      }
    >
      <Route path={routeMap.CUSTOMER_DASHBOARD.path} element={<CustomerDashboard />} />
      <Route path={routeMap.CUSTOMER_ORDERS.path} element={<OrderTracking />} />
      <Route path={routeMap.CUSTOMER_ORDER_DETAIL.path} element={<CustomerOrderDetail />} />
      <Route path={routeMap.CUSTOMER_BOOKINGS_DETAIL.path} element={<CustomerOrderDetail />} />
      <Route path={routeMap.CUSTOMER_REPORT_ISSUE.path} element={<ReportIssue />} />
      <Route path={routeMap.CUSTOMER_PROFILE.path} element={<CustomerProfile />} />
      <Route path={routeMap.CUSTOMER_PROJECTS.path} element={<CustomerProjects />} />
      <Route path={routeMap.CUSTOMER_REVIEWS.path} element={<CustomerReviews />} />
    </Route>

    {/* ================= ROLE-ADAPTIVE PORTAL (Customer / Provider) ================= */}
    <Route
      element={
        <ProtectedRoute>
          <RolePortal />
        </ProtectedRoute>
      }
    >
      <Route path={routeMap.CUSTOMER_MESSAGES.path} element={<Messages />} />
      <Route path={routeMap.PROJECT_DETAIL.path} element={<ProjectDetail />} />
      <Route path={routeMap.APPOINTMENTS.path} element={<AppointmentsPage />} />
      <Route path={routeMap.CUSTOMER_BOOKINGS.path} element={<AppointmentsPage />} />
    </Route>

    {/* ================= PROVIDER PORTAL ================= */}
    <Route
      element={
        <ProtectedRoute>
          <ProviderPortal />
        </ProtectedRoute>
      }
    >
      <Route path={routeMap.PROVIDER_DASHBOARD.path} element={<ProviderDashboard />} />
      <Route path={routeMap.PROVIDER_OPPORTUNITIES.path} element={<ProviderLeads />} />
      <Route path={routeMap.PROVIDER_JOBS.path} element={<ProviderJobs />} />
      <Route path={routeMap.PROVIDER_ORDERS.path} element={<ProviderJobs />} />
      <Route path={routeMap.PROVIDER_ORDER_DETAIL.path} element={<ProviderOrderDetail />} />
      <Route path={routeMap.PROVIDER_PRICING.path} element={<ProviderPricing />} />
      <Route path={routeMap.PROVIDER_SERVICES_PRICING.path} element={<ProviderPricing />} />
      <Route path={routeMap.PROVIDER_AVAILABILITY.path} element={<ProviderAvailability />} />
      <Route path={routeMap.PROVIDER_EARNINGS.path} element={<ProviderEarnings />} />
      <Route path={routeMap.PROVIDER_FEATURED.path} element={<ProviderFeatured />} />
      <Route path={routeMap.PROVIDER_PROFILE_SETTINGS.path} element={<ProviderProfileSettings />} />
    </Route>
  </>
);

export default PrivateRoutes;
