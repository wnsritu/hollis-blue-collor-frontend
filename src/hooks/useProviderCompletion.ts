import { useCallback, useEffect, useSyncExternalStore } from "react";
import { providerCompletionStore } from "@/store/providerCompletionStore";
import { useAuthSession } from "@/hooks/useAuth";

export function useProviderCompletion(autoFetch = false) {
  const state = useSyncExternalStore(
    providerCompletionStore.subscribe,
    providerCompletionStore.getState,
    providerCompletionStore.getState
  );

  const { isProvider, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (autoFetch && isProvider && isAuthenticated && !state.profile && !state.loading) {
      providerCompletionStore.refresh();
    }
  }, [autoFetch, isProvider, isAuthenticated, state.profile, state.loading]);

  const refresh = useCallback(() => {
    return providerCompletionStore.refresh();
  }, []);

  const openModal = useCallback((route?: string) => {
    providerCompletionStore.openModal(route);
  }, []);

  const closeModal = useCallback(() => {
    providerCompletionStore.closeModal();
  }, []);

  const updateFromData = useCallback((profile: any, user?: any, avail?: any) => {
    return providerCompletionStore.updateFromData(profile, user, avail);
  }, []);

  return {
    profile: state.profile,
    completion: state.completion,
    isComplete: state.completion.isComplete,
    percentage: state.completion.percentage,
    completedCount: state.completion.completedCount,
    totalCount: state.completion.totalCount,
    steps: state.completion.steps,
    firstIncompleteStep: state.completion.firstIncompleteStep,
    loading: state.loading,
    showModal: state.showModal,
    restrictedRoute: state.restrictedRoute,
    openModal,
    closeModal,
    refresh,
    updateFromData,
  };
}
