/**
 * Raw row from the passed-capstone-tasks join (one row per task — the latest
 * passing attempt, via `DISTINCT ON (mt.id)`).
 */
export interface UserCapstoneTaskRow {
    /** Milestone-task id (dedup key). */
    taskId: string
    /** Milestone-task title. */
    taskTitle: string
    /** Milestone title. */
    milestoneTitle: string
    /** Course id (turned into an opaque global id by the resolver). */
    courseId: string
    /** Course title. */
    courseTitle: string
    /** Score achieved on the passing attempt. */
    score: number
    /** When the task was passed (processed), or null. */
    passedAt: Date | null
}
