/**
 * Raw-SQL row shapes for the talent-candidates course-scoped batch aggregates.
 * Column names are the exact wire-format (snake_case) returned by Postgres;
 * aggregates come back as strings and are `Number()`-coerced in the service.
 *
 * These mirror the job-readiness aggregate rows but are keyed to ONE course +
 * a BATCH of enrollments (many candidates, one track) rather than one learner's
 * many tracks -- hence a separate, batch-shaped set.
 */

/** One row: total capstone tasks for the single filtered course (the % denominator, shared by every candidate). */
export interface CourseCapstoneTotalRow {
    /** `COUNT(milestone_tasks.id)` for the filtered course. */
    total: string
}

/** One row of the "distinct passed capstone tasks per enrollment" aggregate, over the candidate batch. */
export interface CandidateCapstonePassedRow {
    /** `enrollments.id` the count belongs to. */
    enrollment_id: string
    /** `COUNT(DISTINCT user_milestone_tasks.milestone_task_id)` where an attempt passed. */
    passed: string
}

/** One row of the "recent-window average mock-interview score per enrollment" aggregate, over the candidate batch. */
export interface CandidateInterviewAvgRow {
    /** `enrollments.id` the average belongs to. */
    enrollment_id: string
    /** `AVG(mock_interview_attempts.overall_score)` over that enrollment's recent window. */
    avg_score: string
}

/** One row of the "best unified-CV score for this course, per user" aggregate, over the candidate batch. */
export interface CandidateCvScoreRow {
    /** `users.id` the best CV score belongs to. */
    user_id: string
    /** `MAX(cv_generations.score)` for that user tied to the filtered course. */
    max_score: string
}
