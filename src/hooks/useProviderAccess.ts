import { useCallback, useSyncExternalStore } from "react";
import {
  providerAccessStore,
  type ProviderAccessState,
  type ProviderCapabilities,
} from "@/store/providerAccessStore";
import { providerCompletionStore } from "@/store/providerCompletionStore";

/**
 * Hook to access centralized Provider subscription capabilities and limits.
 */
export function useProviderAccess() {
  const state: ProviderAccessState = useSyncExternalStore(
    providerAccessStore.subscribe,
    providerAccessStore.getState,
    providerAccessStore.getState
  );

  const completionState = useSyncExternalStore(
    providerCompletionStore.subscribe,
    providerCompletionStore.getState,
    providerCompletionStore.getState
  );

  const profile = completionState.profile;
  const profileSuspended = Boolean(
    profile &&
      (Boolean(profile.is_suspended) ||
        ["paused", "suspended", "inactive"].includes(String(profile.status).toLowerCase()))
  );

  const isSuspended = state.isSuspended || profileSuspended;
  const suspendReason =
    profile?.rejection_reason ||
    profile?.suspend_reason ||
    state.suspendReason ||
    (isSuspended ? "Account suspended by administration due to policy compliance review." : null);

  const can = useCallback(
    (capability: keyof ProviderCapabilities): boolean => {
      if (isSuspended) return false;
      return Boolean(state.capabilities[capability]);
    },
    [state.capabilities, isSuspended]
  );

  const refresh = useCallback(() => {
    providerCompletionStore.refresh();
    return providerAccessStore.fetchSubscriptionAccess();
  }, []);

  const subStatus = state.subscriptionData?.subscription?.status;

  const hasActiveSubscription =
    !isSuspended &&
    Boolean(
      state.subscriptionData?.subscription &&
        (subStatus === "active" || subStatus === "paid" || subStatus === "trialing")
    );

  const isUnsubscribed = !isSuspended && (!hasActiveSubscription || state.limits.proposalLimit === 0);

  const isLimitReached =
    !isSuspended &&
    hasActiveSubscription &&
    state.limits.proposalLimit !== null &&
    state.limits.proposalsRemaining !== null &&
    state.limits.proposalsRemaining <= 0;

  return {
    ...state,
    can,
    refresh,
    isSuspended,
    suspendReason,
    hasActiveSubscription,
    isUnsubscribed,
    isLimitReached,
    subscription: state.subscriptionData?.subscription || null,
    plan: state.subscriptionData?.plan || null,
    usage: state.subscriptionData?.usage || null,
  };
}

export default useProviderAccess;
