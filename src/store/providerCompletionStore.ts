import { computeProfileCompletion, type ProfileCompletionStatus } from "@/utils/providerProfileCompletion";
import { providerApi } from "@/services/provider";
import { getProviderAvailability } from "@/services/provider.service";
import { authStore } from "@/store/authStore";

export interface ProviderCompletionState {
  profile: any | null;
  completion: ProfileCompletionStatus;
  loading: boolean;
  showModal: boolean;
  restrictedRoute: string | null;
}

type Listener = (state: ProviderCompletionState) => void;
const listeners = new Set<Listener>();

const initialCompletion = computeProfileCompletion(null, null);

let state: ProviderCompletionState = {
  profile: null,
  completion: initialCompletion,
  loading: false,
  showModal: false,
  restrictedRoute: null,
};

const emit = () => {
  listeners.forEach((l) => l(state));
};

const setState = (partial: Partial<ProviderCompletionState>) => {
  state = { ...state, ...partial };
  emit();
};

export const providerCompletionStore = {
  getState: () => state,

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  openModal: (route?: string) => {
    setState({ showModal: true, restrictedRoute: route || null });
  },

  closeModal: () => {
    setState({ showModal: false, restrictedRoute: null });
  },

  updateFromData: (providerProfile: any, user?: any, availability?: any) => {
    const authUser = user || authStore.getState().user;
    const completion = computeProfileCompletion(providerProfile, authUser, availability);
    setState({
      profile: providerProfile,
      completion,
    });
    return completion;
  },

  refresh: async () => {
    setState({ loading: true });
    try {
      const [profileRes, availRes] = await Promise.all([
        providerApi.getMyMarketplaceProfile().catch(() => null),
        getProviderAvailability().catch(() => null),
      ]);

      const profile = (profileRes as any)?.data || profileRes || null;
      const rawAvail = (availRes as any)?.data?.availability || (availRes as any)?.availability || availRes || null;
      const authUser = authStore.getState().user;

      const completion = computeProfileCompletion(profile, authUser, rawAvail);

      setState({
        profile,
        completion,
        loading: false,
      });

      return completion;
    } catch (err) {
      console.error("Failed to refresh provider completion", err);
      setState({ loading: false });
      return state.completion;
    }
  },
};
