import type { Project } from "./project";
import type { MarketplaceProvider } from "./search";

/** M3 Matching / leads */

export type MatchStatus =
  | "pending"
  | "viewed"
  | "interested"
  | "declined"
  | "expired";

export type ProjectMatch = {
  id?: number;
  project_id: number;
  provider_id: number;
  match_score?: number | string;
  match_reason?: string[] | Record<string, unknown> | null;
  status?: MatchStatus;
  distance_miles?: number | string | null;
  provider?: MarketplaceProvider;
  project?: Project;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type RespondToMatchPayload = {
  /** interested | declined | viewed */
  status: "interested" | "declined" | "viewed";
};
