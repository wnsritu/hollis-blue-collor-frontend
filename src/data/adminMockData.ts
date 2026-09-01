export const adminStats = {
  totalCustomers: 1248,
  totalProviders: 87,
  activeOrders: 34,
  totalRevenue: 48750.00,
};

export const adminRecentActivity = [
  { id: "1", type: "provider_signup", message: "New provider 'Sparkle Wash Hub' signed up", time: "5 min ago" },
  { id: "2", type: "order", message: "Order ORD-201 placed by Alex Johnson", time: "12 min ago" },
  { id: "3", type: "dispute", message: "Dispute raised for order ORD-198", time: "25 min ago" },
  { id: "4", type: "provider_signup", message: "New provider 'Quick Press Laundry' signed up", time: "1 hr ago" },
  { id: "5", type: "order", message: "Order ORD-200 completed by Maria's Laundry", time: "2 hr ago" },
  { id: "6", type: "dispute", message: "Dispute resolved for order ORD-195", time: "3 hr ago" },
];

export const adminOrdersChart = [
  { day: "Mon", orders: 18 },
  { day: "Tue", orders: 24 },
  { day: "Wed", orders: 20 },
  { day: "Thu", orders: 32 },
  { day: "Fri", orders: 28 },
  { day: "Sat", orders: 38 },
  { day: "Sun", orders: 22 },
];

export const adminProviders = [
  { id: "1", name: "Maria Garcia", businessName: "Maria's Laundry Care", verification: "Verified", rating: 4.8, status: "Active" },
  { id: "2", name: "James Lee", businessName: "Fresh & Clean Co.", verification: "Verified", rating: 4.6, status: "Active" },
  { id: "3", name: "Sarah Chen", businessName: "Sparkle Wash Hub", verification: "Pending", rating: 0, status: "Pending" },
  { id: "4", name: "Mike Brown", businessName: "Quick Press Laundry", verification: "Pending", rating: 0, status: "Pending" },
  { id: "5", name: "Elena Volkov", businessName: "Elite Garment Care", verification: "Verified", rating: 4.7, status: "Paused" },
  { id: "6", name: "David Okafor", businessName: "Sunshine Cleaners", verification: "Verified", rating: 4.5, status: "Active" },
];

export const adminOrders = [
  { id: "ORD-201", customer: "Alex Johnson", provider: "Maria's Laundry Care", serviceDate: "2026-03-15", status: "In Process", paymentStatus: "Paid", amount: 24.97 },
  { id: "ORD-202", customer: "Sarah Williams", provider: "Fresh & Clean Co.", serviceDate: "2026-03-14", status: "Received", paymentStatus: "Paid", amount: 18.50 },
  { id: "ORD-203", customer: "Mike Chen", provider: "Sparkle Wash Hub", serviceDate: "2026-03-13", status: "Finished", paymentStatus: "Paid", amount: 32.94 },
  { id: "ORD-204", customer: "Emma Davis", provider: "Quick Press Laundry", serviceDate: "2026-03-12", status: "Delivering", paymentStatus: "Pending", amount: 11.97 },
  { id: "ORD-205", customer: "James Wilson", provider: "Elite Garment Care", serviceDate: "2026-03-11", status: "Finished", paymentStatus: "Paid", amount: 22.45 },
];

export const adminDisputes = [
  { id: "DSP-001", orderId: "ORD-198", customer: "Alex Johnson", provider: "Fresh & Clean Co.", issueType: "Damaged Items", status: "Open", description: "Two shirts returned with stains that were not there before.", customerComment: "My shirts had bleach marks on them after the wash.", providerResponse: "We followed standard procedures. The stains may have been pre-existing." },
  { id: "DSP-002", orderId: "ORD-195", customer: "Emma Davis", provider: "Sparkle Wash Hub", issueType: "Late Delivery", status: "Resolved", description: "Order was delivered 2 days late.", customerComment: "I needed my clothes for a trip and they arrived after I left.", providerResponse: "We had an equipment malfunction. We apologize for the delay." },
  { id: "DSP-003", orderId: "ORD-190", customer: "Mike Chen", provider: "Quick Press Laundry", issueType: "Missing Items", status: "Open", description: "One dress is missing from the order.", customerComment: "I sent 3 dresses but only received 2 back.", providerResponse: "We are checking our facility for the missing item." },
];

export const adminSponsored = [
  { id: "1", provider: "Maria's Laundry Care", startDate: "2026-03-01", endDate: "2026-03-31", status: "Active" },
  { id: "2", provider: "Elite Garment Care", startDate: "2026-02-15", endDate: "2026-03-15", status: "Expiring" },
  { id: "3", provider: "Fresh & Clean Co.", startDate: "2026-01-01", endDate: "2026-02-28", status: "Expired" },
];

export const adminCoinsHistory = [
  { id: "1", user: "Alex Johnson", coins: 50, reason: "Welcome Bonus", date: "2026-03-10" },
  { id: "2", user: "Sarah Williams", coins: -20, reason: "Order Discount", date: "2026-03-09" },
  { id: "3", user: "Mike Chen", coins: 100, reason: "Referral Reward", date: "2026-03-08" },
  { id: "4", user: "Emma Davis", coins: 30, reason: "Promo Campaign", date: "2026-03-07" },
];

export const adminConversations = [
  { id: "CONV-001", customer: "Alex Johnson", provider: "Maria's Laundry Care", lastMessage: "Your order is ready for delivery!", date: "2026-03-15" },
  { id: "CONV-002", customer: "Sarah Williams", provider: "Fresh & Clean Co.", lastMessage: "Thanks for using our service!", date: "2026-03-14" },
  { id: "CONV-003", customer: "Mike Chen", provider: "Sparkle Wash Hub", lastMessage: "We'll pick up at 10 AM tomorrow.", date: "2026-03-13" },
];
