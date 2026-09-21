import apiClient from "@/services/axios";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreateFeaturedPlanPayload,
  UpdateFeaturedPlanPayload,
} from "@/types/featured";

/**
 * Admin: Get all featured plans with lifetime boost revenue and purchase statistics.
 */
export const getAdminFeaturedPlans = async () => {
  const res = await apiClient.get(ENDPOINTS.featuredPlan.adminList);
  return res.data;
};

/**
 * Admin: Create a new featured boost plan.
 */
export const createFeaturedPlan = async (payload: CreateFeaturedPlanPayload) => {
  const res = await apiClient.post(ENDPOINTS.featuredPlan.adminCreate, payload);
  return res.data;
};

/**
 * Admin: Update an existing featured plan (price, active state, duration, etc.).
 */
export const updateFeaturedPlan = async (
  id: number | string,
  payload: UpdateFeaturedPlanPayload
) => {
  const res = await apiClient.patch(
    ENDPOINTS.featuredPlan.adminUpdate(id),
    payload
  );
  return res.data;
};

/**
 * Admin: Delete a featured plan.
 */
export const deleteFeaturedPlan = async (id: number | string) => {
  const res = await apiClient.delete(ENDPOINTS.featuredPlan.adminDelete(id));
  return res.data;
};

/**
 * Admin: Get all marketplace featured listings.
 */
export const getAdminFeaturedListings = async () => {
  const res = await apiClient.get(ENDPOINTS.featuredListing.adminList);
  return res.data;
};

/**
 * Public / Provider: Get all active featured plans available for purchase.
 */
export const getActiveFeaturedPlans = async () => {
  const res = await apiClient.get(ENDPOINTS.featuredPlan.activeList);
  return res.data;
};

/**
 * Provider: Get current provider's featured listings.
 */
export const getMyFeaturedListings = async () => {
  const res = await apiClient.get(ENDPOINTS.featuredListing.myList);
  return res.data;
};

/**
 * Provider: Create purchase intent for a featured plan placement.
 */
export const purchaseFeaturedListing = async (payload: {
  plan_id?: number | string;
  duration_days?: number;
  price?: number;
}) => {
  const res = await apiClient.post(
    ENDPOINTS.featuredListing.purchase,
    payload
  );
  return res.data;
};

/**
 * Provider: Confirm payment and activate featured placement.
 */
export const confirmFeaturedListing = async (paymentIntentId: string) => {
  const res = await apiClient.post(ENDPOINTS.featuredListing.confirm, {
    payment_intent_id: paymentIntentId,
  });
  return res.data;
};

export default {
  getAdminFeaturedPlans,
  createFeaturedPlan,
  updateFeaturedPlan,
  deleteFeaturedPlan,
  getAdminFeaturedListings,
  getActiveFeaturedPlans,
  getMyFeaturedListings,
  purchaseFeaturedListing,
  confirmFeaturedListing,
};
