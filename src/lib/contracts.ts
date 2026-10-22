/** Shared domain interfaces. Never cast unvalidated network/DB payloads to these. */
export const DIMENSIONS = ["noise", "crowds", "brightness", "scent"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export type Intensity = 1 | 2 | 3 | 4 | 5;
export type Intensities = Record<Dimension, Intensity | null>;
export const FEATURE_KEYS = [
  "accessible_entrance", "step_free_access", "accessible_toilet", "seating", "quiet_room",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type ModerationStatus = "pending" | "approved" | "rejected";
export type ProvenanceStatus = "verified" | "needs_review" | "unverified";

export type FacilityEvidence =
  | { verification: "verified"; value: boolean; sourceUrl: string; checkedAt: string; evidence: string }
  | { verification: "unknown"; value: null; sourceUrl: null; checkedAt: null; evidence: null };

export interface VenueSource {
  sourceUrl: string;
  checkedAt: string;
  provenanceStatus: ProvenanceStatus;
  evidence: string;
}

export interface SpaceSummary {
  id: string;
  slug: string;
  name: string;
  address: string;
  category: "library" | "park" | "community_centre" | "museum";
  latitude: number | null;
  longitude: number | null;
  timeZone: string;
  source: VenueSource;
}

export interface SpaceDetails extends SpaceSummary {
  features: Record<FeatureKey, FacilityEvidence>;
  reports: ApprovedReport[];
  match: MatchResult;
  reliability: Reliability;
}

/** Public read adapter output, before local preferences are applied. */
export interface PublicSpace extends SpaceSummary {
  features: Record<FeatureKey, FacilityEvidence>;
  reports: ApprovedReport[];
}
export interface Directory {
  mode: "curated" | "supabase";
  spaces: PublicSpace[];
  asOf: string;
}

export interface ReportInput {
  spaceId: string;
  observedAt: string;
  intensities: Intensities;
}

export interface ApprovedReport extends ReportInput {
  id: string;
  status: "approved";
  isFixture: false;
  createdAt: string;
}

export interface ReportReceipt { id: string; status: "pending" }
export interface Preferences {
  version: 1;
  maximumIntensities: Intensities;
  requiredFeatures: FeatureKey[];
}

export type MatchResult =
  | { score: null; reason: "insufficient_evidence" | "no_preferences" }
  | {
      score: number;
      reason: "eligible";
      dimensions: Array<{ dimension: Dimension; median: number; count: number; effectiveWeight: number }>;
      excludedDimensions: Dimension[];
      explanation: string;
    };

export interface Reliability {
  label: "no_observations" | "limited_observations" | "recent_observations";
  approvedRecentCount: number;
  countsByDimension: Record<Dimension, number>;
  distinctObservationDates: number;
  latestObservedAt: string | null;
}

export type ErrorCode = "setup_required" | "unavailable" | "not_found" | "invalid_input" | "rate_limited";
export interface AppError { code: ErrorCode; message: string; fields?: Record<string, string> }
export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };
