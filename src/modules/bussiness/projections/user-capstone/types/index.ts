import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one user's capstone projection row. */
export interface RecomputeUserCapstoneParams {
    /** The user whose passed-capstone-tasks aggregate to rebuild. */
    userId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** One passed capstone task in the projection's jsonb `value.tasks` (raw jsonb shape). */
export interface UserCapstoneTaskValue {
    /** Course id (turned into a global id by the resolver). */
    courseId: string
    /** Course title. */
    courseTitle: string
    /** Milestone title. */
    milestoneTitle: string
    /** Milestone-task title. */
    taskTitle: string
    /** Score on the passing attempt. */
    score: number
    /** Passed timestamp as an ISO string (jsonb), or null. */
    passedAt: string | null
}

/** One passed capstone task in the typed view returned by the service. */
export interface UserCapstoneTaskResult {
    /** Course id (turned into a global id by the resolver). */
    courseId: string
    /** Course title. */
    courseTitle: string
    /** Milestone title. */
    milestoneTitle: string
    /** Milestone-task title. */
    taskTitle: string
    /** Score on the passing attempt. */
    score: number
    /** Passed time, or null. */
    passedAt: Date | null
}
