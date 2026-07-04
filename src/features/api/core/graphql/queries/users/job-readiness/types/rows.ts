/**
 * Raw-SQL row shapes for the job-readiness aggregation queries. Column names are
 * the exact wire-format (snake_case) returned by Postgres; aggregates come back
 * as strings and are `Number()`-coerced in the service.
 */

/** One row of the "total capstone tasks per course" aggregate. */
export interface CapstoneTotalRow {
    /** `courses.id` the count belongs to. */
    course_id: string
    /** `COUNT(milestone_tasks.id)` for that course — total capstone tasks. */
    total: string
}

/** One row of the "distinct passed capstone tasks per enrollment" aggregate. */
export interface CapstonePassedRow {
    /** `enrollments.id` the count belongs to. */
    enrollment_id: string
    /** `COUNT(DISTINCT user_milestone_tasks.milestone_task_id)` where an attempt passed. */
    passed: string
}

/** One row of the "average mock-interview score per enrollment" aggregate. */
export interface InterviewAvgRow {
    /** `enrollments.id` the average belongs to. */
    enrollment_id: string
    /** `AVG(mock_interview_attempts.overall_score)` for that enrollment. */
    avg_score: string
}
