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

/** CDC row from `user_milestone_task_attempts` (carries the parent user_milestone_task_id, not user_id). */
export interface MilestoneTaskAttemptCdcRow {
    /** The user_milestone_tasks row this attempt belongs to. */
    user_milestone_task_id?: string
}

/** Raw row resolving the owning user id from a milestone-task attempt (via its enrollment). */
export interface CapstoneEnrollmentUserIdRow {
    /** The user who owns the looked-up enrollment. */
    user_id: string
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

/** One milestone task inside the capstone-progress jsonb `value.courses` (raw jsonb shape). */
export interface UserCapstoneProgressTaskValue {
    /** Milestone-task title. */
    title: string
    /** Task ordering position within its milestone (ascending). */
    position: number
    /** Whether the user has a passing attempt for this task. */
    passed: boolean
    /** Score on the passing attempt, or 0 when not passed. */
    score: number
    /** Passed timestamp as an ISO string (jsonb), or null. */
    passedAt: string | null
}

/** One milestone inside the capstone-progress jsonb `value.courses` (raw jsonb shape). */
export interface UserCapstoneProgressMilestoneValue {
    /** Milestone title. */
    title: string
    /** Milestone ordering position within its course (ascending). */
    position: number
    /** Total tasks in the milestone. */
    totalTasks: number
    /** Tasks the user has passed in this milestone. */
    passedTasks: number
    /** All tasks of the milestone, ordered by position ascending. */
    tasks: Array<UserCapstoneProgressTaskValue>
}

/** One enrolled course inside the capstone-progress jsonb `value.courses` (raw jsonb shape). */
export interface UserCapstoneProgressCourseValue {
    /** Course id (turned into a global id by the resolver). */
    courseId: string
    /** Course title. */
    courseTitle: string
    /** Total milestones in the course. */
    totalMilestones: number
    /** Milestones fully completed (totalTasks > 0 and all tasks passed). */
    completedMilestones: number
    /** Total milestone tasks in the course. */
    totalTasks: number
    /** Distinct milestone tasks the user has passed. */
    completedTasks: number
    /** All milestones of the course, ordered by position ascending. */
    milestones: Array<UserCapstoneProgressMilestoneValue>
}

/** One milestone task in the typed capstone-progress view returned by the service. */
export interface UserCapstoneProgressTaskResult {
    /** Milestone-task title. */
    title: string
    /** Task ordering position within its milestone (ascending). */
    position: number
    /** Whether the user has a passing attempt for this task. */
    passed: boolean
    /** Score on the passing attempt, or 0 when not passed. */
    score: number
    /** Passed time, or null. */
    passedAt: Date | null
}

/** One milestone in the typed capstone-progress view returned by the service. */
export interface UserCapstoneProgressMilestoneResult {
    /** Milestone title. */
    title: string
    /** Milestone ordering position within its course (ascending). */
    position: number
    /** Total tasks in the milestone. */
    totalTasks: number
    /** Tasks the user has passed in this milestone. */
    passedTasks: number
    /** All tasks of the milestone, ordered by position ascending. */
    tasks: Array<UserCapstoneProgressTaskResult>
}

/** One enrolled course in the typed capstone-progress view returned by the service. */
export interface UserCapstoneProgressCourseResult {
    /** Course id (turned into a global id by the resolver). */
    courseId: string
    /** Course title. */
    courseTitle: string
    /** Total milestones in the course. */
    totalMilestones: number
    /** Milestones fully completed (totalTasks > 0 and all tasks passed). */
    completedMilestones: number
    /** Total milestone tasks in the course. */
    totalTasks: number
    /** Distinct milestone tasks the user has passed. */
    completedTasks: number
    /** All milestones of the course, ordered by position ascending. */
    milestones: Array<UserCapstoneProgressMilestoneResult>
}
