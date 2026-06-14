import type {
    EntityManager,
} from "typeorm"

/**
 * Params for recomputing one course's stats projection row.
 */
export interface RecomputeCourseStatsParams {
    /** The course whose counters to rebuild. */
    courseId: string
    /**
     * Caller's transaction manager — pass it from an inline write so the
     * projection commits atomically with the source change; omit for the CDC path.
     */
    entityManager?: EntityManager
}

/**
 * Flat counters for a course — the typed view parsed out of the projection's
 * jsonb `value`.
 */
export interface CourseStatsResult {
    /** Number of enrollments in the course. */
    enrollmentCount: number
}
