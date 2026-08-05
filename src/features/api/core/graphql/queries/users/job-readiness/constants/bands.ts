/** Depth score at/above which a TRACK is "jobReady" (green band). */
export const JOB_READINESS_JOB_READY_THRESHOLD = 70

/** Depth score at/above which a TRACK is "building" (amber band) -- below it is "needsWork". */
export const JOB_READINESS_BUILDING_THRESHOLD = 40

/**
 * How a single track's depth is split across its THREE course-scoped pillars --
 * capstone, mock interview, and CV -- summing to 1.0. Capstone (shipping a real
 * system) weighs the most: building beats explaining. Interview (talking through
 * it) and CV (presenting it) each carry an equal, lighter share. When any pillar
 * is absent (null), the remaining weights are renormalized so a track is never
 * penalized for a pillar its course lacks.
 *
 * Chosen weights: capstone 0.4 - interview 0.3 - cv 0.3 (= 1.0).
 */
export const JOB_READINESS_TRACK_CAPSTONE_WEIGHT = 0.4

/** Mock-interview share of a track's depth (renormalized against present pillars). */
export const JOB_READINESS_TRACK_INTERVIEW_WEIGHT = 0.3

/** CV share of a track's depth -- MAX(unified CV score) attached to this course (renormalized against present pillars). */
export const JOB_READINESS_TRACK_CV_WEIGHT = 0.3

/** Minimum depth for a track to be flagged QUALIFIED (a badge only -- no longer feeds any bonus). */
export const JOB_READINESS_QUALIFIED_TRACK_MIN_DEPTH = 1

/**
 * How many of a learner's MOST RECENT mock-interview attempts (per enrollment,
 * ordered by `created_at DESC`) feed the interview pillar's average.
 *
 * WHY a recent window instead of an all-time average: `AVG(overall_score)`
 * over EVERY attempt ever made means early, weak attempts from when the
 * learner just started practicing drag the average down FOREVER -- the more
 * they practice, the harder it becomes to move the number, even as they get
 * measurably better. That rewards NOT practicing (fewer weak data points)
 * over practicing more. A recent-N average instead reflects "how well do you
 * interview RIGHT NOW", which is what a recruiter actually cares about, and
 * gives learners a real incentive to keep practicing without permanently
 * being punished for early attempts.
 *
 * Recent-AVERAGE (not best-of-recent/MAX) is the deliberate choice here: a
 * MAX over the window would reward spamming attempts until one lucky high
 * score lands, which is easy to game. Averaging the last N still smooths out
 * one-off good/bad sessions while remaining gameable only by sustained good
 * performance.
 *
 * Do NOT "fix" this back to a plain `AVG(...) GROUP BY enrollment_id` over
 * the whole table -- that reintroduces the exact problem this constant exists
 * to solve. See `.workflows/WF-09-interview-recent-window.md`.
 */
export const JOB_READINESS_INTERVIEW_RECENT_WINDOW = 5
