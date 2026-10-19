import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITLE_SUFFIX = " | Hollis";
const DEFAULT_TITLE = "Hollis — Find Trusted Professionals for Your Next Job";

/**
 * Route pattern to page title mapping
 */
const EXACT_TITLE_MAP: Record<string, string> = {
  "/": DEFAULT_TITLE,

  // Auth & Public
  "/login": `Sign In${TITLE_SUFFIX}`,
  "/register": `Create Account${TITLE_SUFFIX}`,
  "/forgot-password": `Forgot Password${TITLE_SUFFIX}`,
  "/reset-password": `Reset Password${TITLE_SUFFIX}`,
  "/verify-email": `Verify Email${TITLE_SUFFIX}`,
  "/verify-otp": `Verify OTP${TITLE_SUFFIX}`,
  "/how-it-works": `How It Works${TITLE_SUFFIX}`,
  "/about": `About Us${TITLE_SUFFIX}`,
  "/search": `Search Service Providers${TITLE_SUFFIX}`,
  "/booking/cleaning": `Cleaning Service Booking${TITLE_SUFFIX}`,
  "/booking/carwash": `Car Wash Booking${TITLE_SUFFIX}`,
  "/checkout": `Checkout${TITLE_SUFFIX}`,

  // Customer Routes
  "/dashboard": `Customer Dashboard${TITLE_SUFFIX}`,
  "/customer/bookings": `My Bookings${TITLE_SUFFIX}`,
  "/messages": `Messages${TITLE_SUFFIX}`,
  "/profile": `My Profile${TITLE_SUFFIX}`,
  "/projects": `My Projects${TITLE_SUFFIX}`,
  "/appointments": `Appointments${TITLE_SUFFIX}`,
  "/customer/payments": `Payment History${TITLE_SUFFIX}`,
  "/customer/reviews": `My Reviews${TITLE_SUFFIX}`,

  // Provider Routes
  "/provider/dashboard": `Provider Dashboard${TITLE_SUFFIX}`,
  "/provider/opportunities": `Lead Opportunities${TITLE_SUFFIX}`,
  "/provider/jobs": `Job Management${TITLE_SUFFIX}`,
  "/provider/orders": `Orders & Bookings${TITLE_SUFFIX}`,
  "/provider/pricing": `Services & Pricing${TITLE_SUFFIX}`,
  "/provider/services-pricing": `Services & Pricing${TITLE_SUFFIX}`,
  "/provider/availability": `Availability & Schedule${TITLE_SUFFIX}`,
  "/provider/earnings": `Earnings & Payouts${TITLE_SUFFIX}`,
  "/provider/featured": `Featured Profile${TITLE_SUFFIX}`,
  "/provider/subscription": `Subscription Plan${TITLE_SUFFIX}`,
  "/provider/profile": `Profile Settings${TITLE_SUFFIX}`,
  "/provider/onboarding": `Provider Onboarding${TITLE_SUFFIX}`,

  // Admin Routes
  "/admin": `Admin Dashboard${TITLE_SUFFIX}`,
  "/admin/categories": `Manage Categories${TITLE_SUFFIX}`,
  "/admin/services": `Manage Services${TITLE_SUFFIX}`,
  "/admin/providers": `Manage Providers${TITLE_SUFFIX}`,
  "/admin/customers": `Manage Customers${TITLE_SUFFIX}`,
  "/admin/orders": `Manage Orders${TITLE_SUFFIX}`,
  "/admin/disputes": `Dispute Center${TITLE_SUFFIX}`,
  "/admin/reviews": `Reviews Management${TITLE_SUFFIX}`,
  "/admin/sponsored": `Sponsored Listings${TITLE_SUFFIX}`,
  "/admin/coins": `Coins & Credits${TITLE_SUFFIX}`,
  "/admin/featured": `Featured Listings${TITLE_SUFFIX}`,
  "/admin/reports": `Reports & Analytics${TITLE_SUFFIX}`,
  "/admin/payouts": `Payouts Management${TITLE_SUFFIX}`,
  "/admin/commission": `Commission Settings${TITLE_SUFFIX}`,
  "/admin/subscriptions": `Subscriptions${TITLE_SUFFIX}`,
  "/admin/featured-plans": `Featured Plans${TITLE_SUFFIX}`,
  "/admin/featured-listings": `Featured Listings${TITLE_SUFFIX}`,
  "/admin/transactions": `Transaction History${TITLE_SUFFIX}`,
  "/admin/messages": `Admin Messages${TITLE_SUFFIX}`,
  "/admin/profile": `Admin Profile${TITLE_SUFFIX}`,
  "/admin/support-agents": `Support Agents${TITLE_SUFFIX}`,
  "/admin/settings": `Admin Settings${TITLE_SUFFIX}`,

  // Support Routes
  "/support-dashboard": `Support Dashboard${TITLE_SUFFIX}`,
  "/support-dashboard/messages": `Support Chats${TITLE_SUFFIX}`,
  "/support-dashboard/providers": `Support Provider Verification${TITLE_SUFFIX}`,
  "/support-dashboard/refunds": `Support Refunds${TITLE_SUFFIX}`,
  "/support-dashboard/disputes": `Support Disputes${TITLE_SUFFIX}`,
  "/support-dashboard/settings": `Support Settings${TITLE_SUFFIX}`,
};

const DYNAMIC_PATTERN_MAP: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/provider\/custom-requests\/[^\/]+$/, title: `Custom Request Details${TITLE_SUFFIX}` },
  { pattern: /^\/provider\/order\/[^\/]+$/, title: `Provider Order Details${TITLE_SUFFIX}` },
  { pattern: /^\/provider\/[^\/]+$/, title: `Provider Profile${TITLE_SUFFIX}` },
  { pattern: /^\/book\/[^\/]+$/, title: `Book Service${TITLE_SUFFIX}` },
  { pattern: /^\/booking\/[^\/]+$/, title: `Booking Details${TITLE_SUFFIX}` },
  { pattern: /^\/customer\/bookings\/[^\/]+$/, title: `Booking Details${TITLE_SUFFIX}` },
  { pattern: /^\/order\/[^\/]+$/, title: `Order Details${TITLE_SUFFIX}` },
  { pattern: /^\/projects\/[^\/]+$/, title: `Project Details${TITLE_SUFFIX}` },
  { pattern: /^\/report-issue\/[^\/]+$/, title: `Report Issue${TITLE_SUFFIX}` },
  { pattern: /^\/rating\/[^\/]+$/, title: `Leave Rating${TITLE_SUFFIX}` },
  { pattern: /^\/admin\/providers\/[^\/]+$/, title: `Provider Details${TITLE_SUFFIX}` },
  { pattern: /^\/admin\/disputes\/[^\/]+$/, title: `Dispute Details${TITLE_SUFFIX}` },
  { pattern: /^\/admin\/messages\/[^\/]+$/, title: `Message Details${TITLE_SUFFIX}` },
  { pattern: /^\/support-dashboard\/disputes\/[^\/]+$/, title: `Dispute Details${TITLE_SUFFIX}` },
];

export function getPageTitle(pathname: string): string {
  if (EXACT_TITLE_MAP[pathname]) {
    return EXACT_TITLE_MAP[pathname];
  }

  for (const item of DYNAMIC_PATTERN_MAP) {
    if (item.pattern.test(pathname)) {
      return item.title;
    }
  }

  // Fallback title formatting if unknown route
  return DEFAULT_TITLE;
}

const PageTitleUpdater = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  return null;
};

export default PageTitleUpdater;
