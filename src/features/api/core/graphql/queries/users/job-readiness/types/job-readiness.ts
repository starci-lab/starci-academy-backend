/**
 * Coarse band for a single track's depth score -- the headline a recruiter scans
 * first. Labels are resolved client-side from the band string.
 */
export type JobReadinessBand = "needsWork" | "building" | "jobReady"

/**
 * One "verified track" on a learner's profile -- a single enrolled course they've
 * built real, AI-graded proof in. Each track stands ALONE (never blended across
 * courses): buying another course adds a card, it does not inflate any scalar.
 * `depthScore` (0-100) is this course's domain competency from its present
 * pillars only; `band` + `isQualified` are derived per-track.
 */
export interface JobReadinessTrack {
    /** Course id (opaque global id encoded at the GraphQL boundary). */
    courseId: string
    /** Course title, for the badge label. */
    courseTitle: string
    /** Course URL slug (`display_id`), so the badge links to the course. */
    courseSlug: string
    /** Capstone completion % (0-100) for this course -- null when the course has no capstone tasks. */
    capstoneScore: number | null
    /** Average mock-interview overall score (0-100) for this course -- null when no attempts. */
    interviewScore: number | null
    /** Best unified-CV score (0-100) tied to this course (`MAX(cv_generations.score)` WHERE `course_id` = this course) -- null when no scored CV is attached to it. */
    cvScore: number | null
    /** Domain competency depth (0-100): weighted avg over PRESENT pillars only -- null when every pillar is null. */
    depthScore: number | null
    /** Coarse readiness band derived from {@link JobReadinessTrack.depthScore} (null depth -> "needsWork"). */
    band: JobReadinessBand
    /** Whether this track clears the qualified-depth floor -- a badge flag only. */
    isQualified: boolean
}

/**
 * The GLOBAL (person-level, not per-course) foundation signals -- a learner has
 * one coding standing and, for now, one best CV regardless of how many courses
 * they take.
 */
export interface JobReadinessFoundation {
    /** Challenge-strength percentile (0-100) across all passed challenges -- null if none. */
    codingPercentile: number | null
    /** Best CV score (0-100) across ALL the learner's CVs -- `GREATEST(MAX(unified cv_generations.score), MAX(legacy cv_submission_attempts.score))` during the migration window -- null if no CV scored yet. Kept for FE non-breakage; the new per-track {@link JobReadinessTrack.cvScore} is additive. */
    cvScore: number | null
}

/** Params for {@link import("../job-readiness.service").JobReadinessService.compute}. */
export interface ComputeJobReadinessParams {
    /** The learner whose readiness to compute -- works for self OR a recruiter viewing another profile. */
    userId: string
}

/**
 * Job-readiness for one learner -- a PORTFOLIO of independent per-track cards plus
 * a single global foundation. There is deliberately NO blended composite scalar:
 * each course is its own card, so acquiring more courses widens the hireable
 * range instead of inflating one number.
 */
export interface JobReadinessResult {
    /** The global, person-level foundation signals (coding + best CV). */
    foundation: JobReadinessFoundation
    /** Verified tracks (one per paid enrollment), strongest depth first (nulls last). */
    tracks: Array<JobReadinessTrack>
}
