import { subscriptionApi } from "@/services/payment";

export interface ProviderSubscriptionInfo {
  id: number;
  provider_id: number;
  plan_id: number;
  status: string;
  start_date?: string;
  end_date?: string;
}

export interface ProviderPlanInfo {
  id: number;
  name: string;
  price: number;
  proposal_limit?: number | null;
  features?: string[] | string | null;
}

export interface ProviderUsageInfo {
  proposals_used: number;
  proposal_limit: number | null;
  proposals_remaining: number | null;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
}

export interface ProviderSubscriptionData {
  subscription: ProviderSubscriptionInfo | null;
  plan: ProviderPlanInfo | null;
  usage: ProviderUsageInfo;
}

export interface ProviderCapabilities {
  createProposal: boolean;
  editProposal: boolean;
  withdrawProposal: boolean;
  messageCustomer: boolean;
  sendAttachment: boolean;
  viewFeed: boolean;
}

export interface ProviderLimits {
  proposalLimit: number | null;
  proposalsUsed: number;
  proposalsRemaining: number | null;
}

export interface ProviderAccessState {
  subscriptionData: ProviderSubscriptionData | null;
  capabilities: ProviderCapabilities;
  limits: ProviderLimits;
  isSuspended: boolean;
  providerStatus: string | null;
  suspendReason: string | null;
  loading: boolean;
  error: string | null;
  isHydrated: boolean;
}

const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  createProposal: false,
  editProposal: true,
  withdrawProposal: true,
  messageCustomer: true,
  sendAttachment: true,
  viewFeed: true,
};

const SUSPENDED_CAPABILITIES: ProviderCapabilities = {
  createProposal: false,
  editProposal: false,
  withdrawProposal: false,
  messageCustomer: false,
  sendAttachment: false,
  viewFeed: false,
};

const DEFAULT_LIMITS: ProviderLimits = {
  proposalLimit: 0,
  proposalsUsed: 0,
  proposalsRemaining: 0,
};

type Listener = (state: ProviderAccessState) => void;
const listeners = new Set<Listener>();

let state: ProviderAccessState = {
  subscriptionData: null,
  capabilities: DEFAULT_CAPABILITIES,
  limits: DEFAULT_LIMITS,
  isSuspended: false,
  providerStatus: null,
  suspendReason: null,
  loading: false,
  error: null,
  isHydrated: false,
};

const emit = () => {
  listeners.forEach((l) => l(state));
};

const setState = (partial: Partial<ProviderAccessState>) => {
  state = { ...state, ...partial };
  emit();
};

export function extractSubscriptionData(res: any): ProviderSubscriptionData {
  const root = res?.data?.data ? res.data.data : res?.data ? res.data : res;
  const dataObj = root?.subscription || root?.plan || root?.usage ? root : root?.data || root;

  const subscription = dataObj?.subscription || null;
  const plan = dataObj?.plan || dataObj?.subscription?.plan || null;
  const usage = dataObj?.usage || {
    proposals_used: 0,
    proposal_limit: subscription ? null : 0,
    proposals_remaining: subscription ? null : 0,
    billing_cycle_start: null,
    billing_cycle_end: null,
  };

  return {
    subscription,
    plan,
    usage: {
      proposals_used: usage.proposals_used ?? 0,
      proposal_limit: usage.proposal_limit ?? (subscription ? null : 0),
      proposals_remaining: usage.proposals_remaining ?? (subscription ? null : 0),
      billing_cycle_start: usage.billing_cycle_start || null,
      billing_cycle_end: usage.billing_cycle_end || null,
    },
  };
}

export function deriveCapabilitiesAndLimits(
  data: ProviderSubscriptionData | null,
  isSuspendedParam = false,
  statusParam: string | null = null
): {
  capabilities: ProviderCapabilities;
  limits: ProviderLimits;
  isSuspended: boolean;
  providerStatus: string | null;
} {
  const isSuspended =
    isSuspendedParam ||
    ["paused", "suspended", "inactive"].includes(String(statusParam).toLowerCase());

  if (isSuspended) {
    return {
      capabilities: SUSPENDED_CAPABILITIES,
      limits: {
        proposalLimit: 0,
        proposalsUsed: data?.usage?.proposals_used || 0,
        proposalsRemaining: 0,
      },
      isSuspended: true,
      providerStatus: statusParam || "paused",
    };
  }

  if (!data) {
    return {
      capabilities: DEFAULT_CAPABILITIES,
      limits: DEFAULT_LIMITS,
      isSuspended: false,
      providerStatus: statusParam,
    };
  }

  const hasActiveSub = Boolean(
    data.subscription &&
      (data.subscription.status === "active" ||
        data.subscription.status === "paid" ||
        data.subscription.status === "trialing")
  );

  const proposalLimit = data.usage?.proposal_limit ?? (hasActiveSub ? null : 0);
  const proposalsRemaining = data.usage?.proposals_remaining ?? (hasActiveSub ? null : 0);
  const proposalsUsed = data.usage?.proposals_used || 0;

  // Provider can create proposals if they have an active sub AND remaining proposals > 0 (or unlimited limit)
  const canCreateProposal =
    hasActiveSub &&
    (proposalLimit === null ||
      (typeof proposalsRemaining === "number" ? proposalsRemaining > 0 : true));

  return {
    capabilities: {
      createProposal: canCreateProposal,
      editProposal: true,
      withdrawProposal: true,
      messageCustomer: true,
      sendAttachment: true,
      viewFeed: true,
    },
    limits: {
      proposalLimit,
      proposalsUsed,
      proposalsRemaining,
    },
    isSuspended: false,
    providerStatus: statusParam,
  };
}

export const providerAccessStore = {
  getState: () => state,

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setSuspended: (isSuspended: boolean, reason?: string) => {
    const { capabilities, limits } = deriveCapabilitiesAndLimits(
      state.subscriptionData,
      isSuspended,
      isSuspended ? "paused" : "active"
    );
    const suspendReason = isSuspended
      ? reason || state.suspendReason || "Account suspended by administration due to policy compliance review."
      : null;
    setState({
      isSuspended,
      providerStatus: isSuspended ? "paused" : "active",
      suspendReason,
      capabilities,
      limits,
      error: reason || (isSuspended ? "Your provider account is suspended" : null),
    });
  },

  fetchSubscriptionAccess: async (): Promise<ProviderAccessState> => {
    setState({ loading: true, error: null });
    try {
      const res: any = await subscriptionApi.getProviderSubscription();
      const rawRoot = res?.data?.data || res?.data || res;
      const isSuspended =
        Boolean(rawRoot?.is_suspended) ||
        Boolean(res?.response?.data?.is_suspended) ||
        ["paused", "suspended", "inactive"].includes(String(rawRoot?.provider_status || rawRoot?.status).toLowerCase());

      const subData = extractSubscriptionData(res);
      const { capabilities, limits, isSuspended: suspendedDerived, providerStatus } =
        deriveCapabilitiesAndLimits(subData, isSuspended, rawRoot?.provider_status || rawRoot?.status);

      setState({
        subscriptionData: subData,
        capabilities,
        limits,
        isSuspended: suspendedDerived,
        providerStatus,
        loading: false,
        error: suspendedDerived ? "Your provider account has been suspended by administration." : null,
        isHydrated: true,
      });
      return state;
    } catch (err: any) {
      const isSuspended =
        Boolean(err?.response?.data?.is_suspended) ||
        err?.response?.status === 403 &&
          (err?.response?.data?.message?.toLowerCase().includes("suspend") ||
            err?.response?.data?.provider_status === "paused");

      const errorMsg = err?.response?.data?.message || err?.message || "Failed to load provider capabilities";

      if (isSuspended) {
        const { capabilities, limits } = deriveCapabilitiesAndLimits(null, true, "paused");
        setState({
          capabilities,
          limits,
          isSuspended: true,
          providerStatus: "paused",
          loading: false,
          error: errorMsg,
          isHydrated: true,
        });
      } else {
        setState({
          loading: false,
          error: errorMsg,
          isHydrated: true,
        });
      }
      return state;
    }
  },

  reset: () => {
    setState({
      subscriptionData: null,
      capabilities: DEFAULT_CAPABILITIES,
      limits: DEFAULT_LIMITS,
      isSuspended: false,
      providerStatus: null,
      loading: false,
      error: null,
      isHydrated: false,
    });
  },
};

export default providerAccessStore;
