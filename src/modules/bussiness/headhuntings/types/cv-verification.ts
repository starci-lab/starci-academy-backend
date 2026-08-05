/**
 * Params for {@link import("../cv-verification.service").CvVerificationService.resolveLevels}.
 */
export interface ResolveCvVerificationLevelsParams {
    /** The batch of user ids to classify into a {@link import("@modules/databases").CvVerificationLevel}. */
    userIds: Array<string>
}

/**
 * Params for {@link import("../cv-verification.service").CvVerificationService.resolveLevelForCourse}.
 */
export interface ResolveCvVerificationLevelForCourseParams {
    /** The learner to classify. */
    userId: string
    /** The course to scope the capstone/challenge check to. */
    courseId: string
}

/**
 * One raw-SQL row of a "user has this class of graded StarCi work" existence
 * probe — a single distinct `user_id`. Column name is the exact wire-format
 * (snake_case) returned by Postgres.
 */
export interface CvVerificationUserIdRow {
    /** `users.id` that has the probed activity (a passed capstone / a graded challenge). */
    user_id: string
}
