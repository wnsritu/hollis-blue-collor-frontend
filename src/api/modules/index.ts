export { authApi } from "./auth.api";
export { userApi } from "./user.api";
export { customerApi } from "./customer.api";
export { catalogApi } from "./catalog.api";
export { providerApi } from "./provider.api";
export { matchingApi } from "./matching.api";
export { projectApi } from "./project.api";
export { proposalApi } from "./proposal.api";
export { appointmentApi } from "./appointment.api";
export { paymentApi, payoutApi } from "./payment.api";
export { subscriptionApi } from "./subscription.api";
export { chatApi } from "./chat.api";
export { disputeApi } from "./dispute.api";
export { serviceApi, itemApi } from "./service.api";
export { ratingApi } from "./rating.api";
export { bookingApi, orderApi } from "./booking.api";
export {
  adminApi,
  availabilityApi,
  timeSlotApi,
  coinApi,
  sponsoredApi,
} from "./admin.api";
export { uploadApi } from "./upload.api";

import { authApi } from "./auth.api";
import { userApi } from "./user.api";
import { customerApi } from "./customer.api";
import { catalogApi } from "./catalog.api";
import { providerApi } from "./provider.api";
import { matchingApi } from "./matching.api";
import { projectApi } from "./project.api";
import { proposalApi } from "./proposal.api";
import { appointmentApi } from "./appointment.api";
import { paymentApi, payoutApi } from "./payment.api";
import { subscriptionApi } from "./subscription.api";
import { chatApi } from "./chat.api";
import { disputeApi } from "./dispute.api";
import { serviceApi, itemApi } from "./service.api";
import { ratingApi } from "./rating.api";
import { bookingApi, orderApi } from "./booking.api";
import {
  adminApi,
  availabilityApi,
  timeSlotApi,
  coinApi,
  sponsoredApi,
} from "./admin.api";
import { uploadApi } from "./upload.api";

/**
 * Single entry for all feature APIs.
 *
 * @example
 * import { api } from "@/api";
 * const { data } = await api.catalog.getTree();
 * await api.upload.uploadProviderDocument(file);
 */
export const api = {
  auth: authApi,
  user: userApi,
  customer: customerApi,
  catalog: catalogApi,
  provider: providerApi,
  matching: matchingApi,
  project: projectApi,
  proposal: proposalApi,
  appointment: appointmentApi,
  payment: paymentApi,
  payout: payoutApi,
  subscription: subscriptionApi,
  chat: chatApi,
  dispute: disputeApi,
  service: serviceApi,
  item: itemApi,
  rating: ratingApi,
  booking: bookingApi,
  order: orderApi,
  admin: adminApi,
  availability: availabilityApi,
  timeSlot: timeSlotApi,
  coin: coinApi,
  sponsored: sponsoredApi,
  upload: uploadApi,
} as const;

export default api;
