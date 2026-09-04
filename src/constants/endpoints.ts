/**
 * API path templates aligned with backend + Postman (M1–M3).
 * Paths are relative to `env.apiBaseUrl` (…/api/v1).
 *
 * Prefer importing via `@/constants` or `@/constants/endpoints`.
 */

export const ENDPOINTS = {
  // ─── M1 Auth ───────────────────────────────────────────
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refreshToken: "/auth/refresh-token",
    me: "/auth/me",
    changePassword: "/auth/change-password",
    googleLogin: "/auth/google-login",
    loginWithOtp: "/auth/login-with-otp",
    sendEmailOtp: "/auth/send-email-otp",
    verifyEmailOtp: "/auth/verify-email-otp",
    verifyEmail: "/auth/verify-email",
    resendVerification: "/auth/resend-verification",
    verifyPhoneOtp: "/auth/verify-phone-otp",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    saveFcmToken: "/auth/save-fcm-token",
    removeFcmToken: "/auth/remove-fcm-token",
    checkEmail: "/auth/check-email",
  },

  /** Legacy forgot-password routes still mounted on backend */
  forgotPasswordLegacy: {
    request: "/forgot-password",
    verifyOtp: "/verify-otp",
    resetPassword: "/reset-password",
  },

  // ─── M1 Profiles ───────────────────────────────────────
  user: {
    myProfile: "/user/my-profile",
    updateAdminProfile: "/user/update-profile",
    updateCustomerProfile: "/user/customer/profile",
    updateProviderProfile: (providerId: number | string) =>
      `/user/provider/profile/${providerId}`,
    updateProfilePhoto: "/user/profile/photo",
    registerAddress: "/user/register",
    updateAddress: (id: number | string) => `/user/user-address/${id}`,
    getAddressByUserId: (userId: number | string) => `/user/user-address/${userId}`,
  },

  customer: {
    root: "/customers",
    byId: (id: number | string) => `/customers/${id}`,
    profile: "/customers/me/profile",
    projects: (id: number | string) => `/customers/${id}/projects`,
    reviews: (id: number | string) => `/customers/${id}/reviews`,
    deactivate: (id: number | string) => `/customers/${id}/deactivate`,
  },

  // ─── M3 Catalog ────────────────────────────────────────
  catalog: {
    tree: "/catalog",
    categories: "/categories",
    serviceTypes: "/service-types",
    services: "/services",
    adminCategories: "/admin/categories",
    adminCategoryById: (id: number | string) => `/admin/categories/${id}`,
    adminServiceTypes: "/admin/service-types",
    adminServiceTypeById: (id: number | string) => `/admin/service-types/${id}`,
    adminServices: "/admin/services",
    adminServiceById: (id: number | string) => `/admin/services/${id}`,
  },

  // ─── Providers (legacy + marketplace) ──────────────────
  provider: {
    list: "/provider/list",
    details: (id: number | string) => `/provider/details/${id}`,
    update: (id: number | string) => `/provider/update/${id}`,
    services: "/provider/services",
    addService: "/provider/service/add",
    serviceById: (id: number | string) => `/provider/service/${id}`,
    bankInfo: (id: number | string) => `/providers/${id}/bank-info`,
    verificationStatus: (id: number | string) => `/providers/${id}/verification-status`,
    verificationDocs: (id: number | string) => `/providers/${id}/verification-docs`,
  },

  marketplaceProvider: {
    root: "/providers",
    search: "/providers/search",
    byId: (id: number | string) => `/providers/${id}`,
    profile: "/providers/me/profile",
    leads: "/providers/me/leads",
    requestQuote: (id: number | string) => `/providers/${id}/request-quote`,
  },

  providerAvailability: {
    root: "/provider-availability",
    byId: (id: number | string) => `/provider-availability/${id}`,
    byProviderId: (providerId: number | string) =>
      `/provider-availability/provider/${providerId}`,
  },

  // ─── M3 Projects / Matching ────────────────────────────
  project: {
    root: "/projects",
    byId: (id: number | string) => `/projects/${id}`,
    status: (id: number | string) => `/projects/${id}/status`,
    customerMy: "/projects/customer/my",
    providerFeed: "/projects/provider/feed",
    attachments: (id: number | string) => `/projects/${id}/attachments`,
    attachmentById: (id: number | string, fileId: number | string) =>
      `/projects/${id}/attachments/${fileId}`,
    matches: (id: number | string) => `/projects/${id}/matches`,
    matchRespond: (id: number | string) => `/projects/${id}/matches/respond`,
    runMatch: (id: number | string) => `/projects/${id}/match`,
  },

  // ─── M3 Proposals ──────────────────────────────────────
  proposal: {
    root: "/proposals",
    byId: (id: number | string) => `/proposals/${id}`,
    projectProposals: (projectId: number | string) => `/proposals/project/${projectId}`,
    providerMy: "/proposals/provider/my",
    accept: (id: number | string) => `/proposals/${id}/accept`,
    reject: (id: number | string) => `/proposals/${id}/reject`,
    expire: (id: number | string) => `/proposals/${id}/expire`,
  },

  // ─── M3 Appointments ───────────────────────────────────
  appointment: {
    me: "/appointments/me",
    byId: (id: number | string) => `/appointments/${id}`,
    status: (id: number | string) => `/appointments/${id}/status`,
    reschedule: (id: number | string) => `/appointments/${id}/reschedule`,
    confirmReschedule: (id: number | string) =>
      `/appointments/${id}/confirm-reschedule`,
  },

  // ─── M3 Chat ───────────────────────────────────────────
  chat: {
    userChats: "/chats/user",
    messages: (chatId: number | string) => `/chats/messages/${chatId}`,
    sendMessage: "/chats/send-message",
    createChat: "/chats/create-chat",
    markAsRead: "/chats/mark-as-read",
    report: (id: number | string) => `/chats/${id}/report`,
    block: (id: number | string) => `/chats/${id}/block`,
  },

  // ─── M2 Payments / Payouts / Subscriptions ─────────────
  payment: {
    createIntent: "/payments/create-payment-intent",
    createIntentAlias: "/payments/create-intent",
    confirm: "/payments/confirm-payment",
    confirmAlias: "/payments/confirm",
    refund: "/payments/refund-payment",
    list: "/payments",
    byId: (id: number | string) => `/payments/${id}`,
    statusByBooking: (bookingId: number | string) => `/payments/status/${bookingId}`,
    commissionBreakdown: (id: number | string) => `/payments/${id}/commission-breakdown`,
    refundById: (id: number | string) => `/payments/${id}/refund`,
  },

  payout: {
    commissionRates: "/commission-rates",
    adminPayouts: "/admin/payouts",
    history: "/admin/payouts/history",
    process: (id: number | string) => `/admin/payouts/${id}/process`,
    markEligible: (id: number | string) => `/admin/payouts/${id}/eligible`,
    fail: (id: number | string) => `/admin/payouts/${id}/fail`,
  },

  subscription: {
    plans: "/subscriptions/plans",
    createCheckout: "/subscriptions/create-checkout-session",
    createIntent: "/subscriptions/create-intent",
    confirm: "/subscriptions/confirm",
    current: "/subscriptions/current",
    cancel: "/subscriptions/cancel",
    history: "/subscriptions/history",
    status: "/subscriptions/status",
    allProviders: "/subscriptions/all-providers",
  },

  // ─── Support / legacy ──────────────────────────────────
  dispute: {
    create: "/disputes/create",
    list: "/disputes/list",
    details: (id: number | string) => `/disputes/details/${id}`,
    updateStatus: (id: number | string) => `/disputes/update-status/${id}`,
    addEvidence: (id: number | string) => `/disputes/add-evidence/${id}`,
    resolve: (id: number | string) => `/disputes/resolve/${id}`,
  },

  service: {
    add: "/services/add",
    list: "/services/list",
    categories: "/services/categories",
    byId: (id: number | string) => `/services/${id}`,
  },

  item: {
    add: "/items/add",
    list: "/items/list",
    byId: (id: number | string) => `/items/${id}`,
  },

  rating: {
    add: "/ratings/add",
    list: "/ratings/list",
    booking: (bookingId: number | string) => `/ratings/booking/${bookingId}`,
    provider: (providerId: number | string) => `/ratings/provider/${providerId}`,
  },

  booking: {
    add: "/booking/add",
    list: "/booking/list",
    details: (id: number | string) => `/booking/${id}`,
    edit: (id: number | string) => `/booking/${id}`,
    updateStatus: (id: number | string) => `/booking/status/${id}`,
    delete: (id: number | string) => `/booking/${id}`,
    updatePrice: "/booking/update-price",
    dashboard: "/booking/dashboard",
  },

  order: {
    list: "/order/list",
    details: (id: number | string) => `/order/${id}`,
  },

  admin: {
    dashboard: "/admin/dashboard",
    providers: "/admin/providers",
    providerDetails: (id: number | string) => `/admin/providers/${id}`,
    approveProvider: (id: number | string) => `/admin/providers/${id}/approve`,
    rejectProvider: (id: number | string) => `/admin/providers/${id}/reject`,
    suspendProvider: (id: number | string) => `/admin/providers/${id}/suspend`,
    unsuspendProvider: (id: number | string) => `/admin/providers/${id}/unsuspend`,
    customers: "/admin/customers",
    customerDetails: (id: number | string) => `/admin/customers/${id}`,
    updateCustomerStatus: (id: number | string) => `/admin/customers/${id}/status`,
    activateCustomer: (id: number | string) => `/admin/customers/${id}/activate`,
    deactivateCustomer: (id: number | string) => `/admin/customers/${id}/deactivate`,
    plansAll: "/admin/plans/all",
    plansUpdate: "/admin/plans/update",
    platformSettings: "/admin/platform-settings",
  },

  timeSlot: {
    list: "/time-slots/list",
    add: "/time-slots/add",
    byId: (id: number | string) => `/time-slots/${id}`,
  },

  coin: {
    balance: "/coins/balance",
    transactions: "/coins/transactions",
    add: "/coins/add",
    deduct: "/coins/deduct",
  },

  bulkPrice: {
    add: "/bulk-price/add",
    list: "/bulk-price/list",
    byId: (id: number | string) => `/bulk-price/${id}`,
  },

  sponsored: {
    list: "/sponsored/list",
    create: "/sponsored/create",
    byId: (id: number | string) => `/sponsored/${id}`,
  },

  // ─── Uploads ───────────────────────────────────────────
  /** POST /upload/:mediaFor/:mediaType — mediaFor: customer|provider|admin ; mediaType: image|document|video */
  upload: {
    media: (mediaFor: string, mediaType: string) =>
      `/upload/${mediaFor}/${mediaType}`,
    providerImage: "/upload/provider/image",
    providerDocument: "/upload/provider/document",
    customerImage: "/upload/customer/image",
  },
} as const;

export default ENDPOINTS;
