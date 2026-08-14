import type {
    EntityManager,
} from "typeorm"

/**
 * Params for recomputing one course's review aggregate.
 */
export interface RecomputeCourseReviewStatsParams {
    /** The course whose aggregate to rebuild. */
    courseId: string
    /**
     * Caller's transaction manager -- pass it from an inline write so the projection commits
     * atomically with the source change; omit for the CDC path.
     */
    entityManager?: EntityManager
}

/**
 * A course's review aggregate -- the typed view parsed out of the projection's jsonb `value`.
 */
export interface CourseReviewStatsResult {
    /** How many reviews the course has. */
    reviewCount: number
    /**
     * Mean score across every review, to two decimals, or zero when there are none.
     *
     * Zero rather than null because a course with no reviews has no rating to argue with, and a
     * nullable number here would make every caller write the same ternary.
     */
    averageScore: number
    /**
     * How many reviews sit at each star, keyed by the star as a string.
     *
     * A mean alone cannot separate "everybody thought it was fine" from "half loved it and half
     * hated it", and those are different products to a buyer.
     */
    scoreHistogram: Record<string, number>
}

/** CDC row from `course_reviews` (carries the course whose aggregate moved). */
export interface CourseReviewStatsCdcRow {
    /** The course the review belongs to. */
    course_id?: string
}
