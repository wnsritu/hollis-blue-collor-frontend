/**
 * React Query key factory — keep keys stable and hierarchical.
 * Usage: queryKeys.projects.detail(id)
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  customers: {
    all: ["customers"] as const,
    me: ["customers", "me"] as const,
    detail: (id: number | string) => ["customers", "detail", id] as const,
  },
  providers: {
    all: ["providers"] as const,
    detail: (id: number | string) => ["providers", "detail", id] as const,
    bank: (id: number | string) => ["providers", "bank", id] as const,
    verification: (id: number | string) => ["providers", "verification", id] as const,
    services: (id?: number | string) => ["providers", "services", id ?? "me"] as const,
  },
  projects: {
    all: ["projects"] as const,
    my: ["projects", "my"] as const,
    feed: ["projects", "feed"] as const,
    detail: (id: number | string) => ["projects", "detail", id] as const,
  },
  proposals: {
    byProject: (projectId: number | string) => ["proposals", "project", projectId] as const,
    my: ["proposals", "my"] as const,
    detail: (id: number | string) => ["proposals", "detail", id] as const,
  },
  payments: {
    detail: (id: number | string) => ["payments", "detail", id] as const,
  },
  payouts: {
    eligible: ["payouts", "eligible"] as const,
    history: ["payouts", "history"] as const,
    commission: ["payouts", "commission"] as const,
  },
  chats: {
    list: ["chats"] as const,
    messages: (chatId: number | string) => ["chats", "messages", chatId] as const,
  },
  services: {
    list: ["services"] as const,
    categories: ["services", "categories"] as const,
  },
  subscriptions: {
    plans: ["subscriptions", "plans"] as const,
    current: ["subscriptions", "current"] as const,
  },
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    settings: ["admin", "settings"] as const,
  },
} as const;

export default queryKeys;
