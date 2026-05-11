/** Shape of a single task in the progress cache. */
export interface MilestoneTaskProgressItem {
    /** Milestone task ID. */
    id: string
    /** Score from the latest attempt. */
    lastScore: number
    /** Maximum possible score for this task. */
    maxScore: number
    /** Whether the task is completed (passed). */
    completed: boolean
    /** Total number of attempts. */
    numAttempts: number
}

/** Cached milestone task progress for a user enrollment. */
export interface MilestoneTaskProgressCacheResult {
    /** Tasks that have been attempted (completed or not). */
    completionTasks: Array<MilestoneTaskProgressItem>
    /** The first uncompleted task, or null if all completed. */
    currentTask: MilestoneTaskProgressItem | null
}
