/**
 * Coarse band for a composite job-readiness score — the headline a recruiter
 * scans first. Labels are resolved client-side from the band string.
 */
export type JobReadinessBand = "needsWork" | "building" | "jobReady"

/**
 * One "verified track" on a learner's profile — a single enrolled course they've
 * built real, AI-graded proof in. Depth (0–100) is this course's domain
 * competency: capstone shipped + mock-interview readiness. Each course adds a
 * track (breadth); a track's depth is what proves domain seniority.
 */
export interface JobReadinessTrack {
    /** Course id (opaque global id encoded at the GraphQL boundary). */
    courseId: string
    /** Course title, for the badge label. */
    courseTitle: string
    /** Course URL slug (`display_id`), so the badge links to the course. */
    courseSlug: string
    /** Capstone completion % (0–100) for this course — null when the course has no capstone tasks. */
    capstoneScore: number | null
    /** Average mock-interview overall score (0–100) for this course — null when no attempts. */
    interviewScore: number | null
    /** Domain competency depth (0–100): weighted(capstone, interview), missing pillar = 0. */
    depthScore: number
}

/**
 * The 2 GLOBAL (person-level, not per-course) foundation signals — a learner has
 * one CV and one cross-course challenge standing regardless of how many courses
 * they take.
 */
export interface JobReadinessFoundation {
    /** Latest CV review score (0–100) — null if no CV reviewed yet. */
    cvScore: number | null
    /** Challenge-strength percentile (0–100) across all passed challenges — null if none. */
    challengeScore: number | null
}

/** Params for {@link import("../job-readiness.service").JobReadinessService.compute}. */
export interface ComputeJobReadinessParams {
    /** The learner whose readiness to compute — works for self OR a recruiter viewing another profile. */
    userId: string
}

/**
 * Composite job-readiness for one learner — a PORTFOLIO, not a single blended
 * average: the strongest track leads, extra qualified tracks add a breadth
 * bonus (so N courses always ≥ N−1 courses, never diluted), and the global
 * foundation (CV + challenge) polishes the whole.
 */
export interface JobReadinessResult extends JobReadinessFoundation {
    /** 0–100 composite — bestTrackDepth (led) + foundation blend + breadth bonus, clamped. */
    compositeScore: number
    /** Coarse readiness band derived from {@link JobReadinessResult.compositeScore}. */
    band: JobReadinessBand
    /** Verified tracks (one per enrolled course), strongest depth first. */
    tracks: Array<JobReadinessTrack>
}
