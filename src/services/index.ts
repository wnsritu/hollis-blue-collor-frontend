export * from "./axios";
export * from "./auth";
export * from "./admin";
export * from "./booking";
export * from "./customer";
export * from "./provider";
export * from "./chat";
export * from "./support";
export * from "./pricing";
export * from "./catalog";
export * from "./payment";
export * from "./rating";
export * from "./project";
export * from "./dashboard/dashboard.service";
export * from "@/lib/api/errors";

// Re-export non-colliding members from order service
export {
  getOrderList,
  getOrderDetails,
  getRatingByBookingId,
  updateOrderStatusApi,
  getDisputeDetail,
  getBookingPaymentSummary,
  getProviderOrders,
  getOrderDetail,
  getBookinById,
  updateOrderStatus,
  orderApi,
} from "./order";

// Namespace service objects for backward compatibility
export * as authService from "./auth";
export * as adminService from "./admin";
export * as bookingService from "./booking";
export * as chatService from "./chat";
export * as orderService from "./order";
export * as pricingService from "./pricing";
export * as providerService from "./provider";
export * as supportService from "./support";
export * as customerService from "./customer";
export * as projectService from "./project";
export * as dashboardService from "./dashboard/dashboard.service";
