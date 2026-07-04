/** Depth score at/above which a TRACK is "jobReady" (green band). */
export const JOB_READINESS_JOB_READY_THRESHOLD = 70

/** Depth score at/above which a TRACK is "building" (amber band) — below it is "needsWork". */
export const JOB_READINESS_BUILDING_THRESHOLD = 40

/**
 * How a single track's depth is split across its THREE course-scoped pillars —
 * capstone, mock interview, and CV — summing to 1.0. Capstone (shipping a real
 * system) weighs the most: building beats explaining. Interview (talking through
 * it) and CV (presenting it) each carry an equal, lighter share. When any pillar
 * is absent (null), the remaining weights are renormalized so a track is never
 * penalized for a pillar its course lacks.
 *
 * Chosen weights: capstone 0.4 · interview 0.3 · cv 0.3 (= 1.0).
 */
export const JOB_READINESS_TRACK_CAPSTONE_WEIGHT = 0.4

/** Mock-interview share of a track's depth (renormalized against present pillars). */
export const JOB_READINESS_TRACK_INTERVIEW_WEIGHT = 0.3

/** CV share of a track's depth — MAX(unified CV score) attached to this course (renormalized against present pillars). */
export const JOB_READINESS_TRACK_CV_WEIGHT = 0.3

/** Minimum depth for a track to be flagged QUALIFIED (a badge only — no longer feeds any bonus). */
export const JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH = 1
