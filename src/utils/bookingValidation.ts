/**
 * Backward compatibility shim.
 * Prefer importing types from `@/types`, constants from `@/constants`, and validations from `@/validations`.
 */
export type {
  ServiceItem,
  PricingItem,
  ServiceType,
  VehicleType,
} from "@/types/booking.types";

export { DEFAULT_VEHICLE_TYPES } from "@/constants/options";

export {
  checkCleaningOffered,
  checkCarWashOffered,
} from "@/validations/booking";
