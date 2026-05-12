/** Shape of a single challenge in the progress cache. */
export interface ChallengeSubmissionProgressItem {
    /** Challenge ID. */
    id: string
    /** Score from the latest attempt. */
    lastScore: number
    /** Maximum possible score for this challenge. */
    maxScore: number
    /** Whether the challenge is completed (passed). */
    completed: boolean
    /** Total number of attempts. */
    numAttempts: number
}

/** Cached challenge submission progress for a user enrollment. */
export interface ChallengeSubmissionProgressCacheResult {
    /** Challenges that have been attempted (completed or not). */
    completionTasks: Array<ChallengeSubmissionProgressItem>
    /** The first uncompleted challenge, or null if all completed. */
    currentTask: ChallengeSubmissionProgressItem | null
}
