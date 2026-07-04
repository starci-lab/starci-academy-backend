/** Composite score at/above which readiness is "jobReady" (green band). */
export const JOB_READINESS_JOB_READY_THRESHOLD = 70

/** Composite score at/above which readiness is "building" (amber band) — below it is "needsWork". */
export const JOB_READINESS_BUILDING_THRESHOLD = 40

/**
 * How a single track's depth is split across its two course-scoped pillars.
 * Capstone (shipping a real system) weighs more than the mock interview
 * (talking through it) — building beats explaining.
 */
export const JOB_READINESS_TRACK_CAPSTONE_WEIGHT = 0.6

/** Mock-interview share of a track's depth (complements the capstone weight). */
export const JOB_READINESS_TRACK_INTERVIEW_WEIGHT = 0.4

/**
 * Composite weighting. The strongest track's depth LEADS (so one course already
 * yields a strong, valid profile); the global foundation (CV + challenge)
 * polishes it. Together they sum to 1; the breadth bonus is added on top.
 */
export const JOB_READINESS_BASE_TRACK_WEIGHT = 0.7

/** Foundation (CV + challenge) share of the composite (complements the base-track weight). */
export const JOB_READINESS_FOUNDATION_WEIGHT = 0.3

/** Points added per QUALIFIED track beyond the first — rewards breadth (2 courses > 1). */
export const JOB_READINESS_BREADTH_BONUS_PER_TRACK = 5

/** Ceiling on the total breadth bonus, so breadth never dwarfs depth. */
export const JOB_READINESS_BREADTH_BONUS_CAP = 15

/** Minimum depth for a track to COUNT toward the breadth bonus (a nascent track earns no bonus). */
export const JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH = 1
