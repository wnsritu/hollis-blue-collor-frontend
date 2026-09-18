// API schema and domain types
export * from "./api";
export * from "./auth.types";
export * from "./pricing.types";
export * from "./provider.types";
export * from "./customer.types";
export * from "./admin.types";
export * from "./store.types";
export * from "./components.types";
export * from "./project.types";
export * from "./status.types";
export * from "./proposal.types";

// Explicit exports to avoid collision with ./api members (ServiceType, ServiceItem, PaginationParams)
export type { Item, ServiceType as ItemServiceType } from "./item.types";
export type {
  PricingItem,
  VehicleType,
  BookingValidationResult,
  ServiceItem as BookingServiceItem,
  ServiceType as BookingServiceType,
} from "./booking.types";
export type {
  StatusType,
  PaginatedResponse,
  BaseOption,
  WithChildren,
  WithClassName,
  PaginationParams as CommonPaginationParams,
} from "./common.types";
export type { ApiResponse } from "./api.types";
