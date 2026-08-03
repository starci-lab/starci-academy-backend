/** Lifecycle state of a challenge for the current user. */
export enum ChallengeProgressStatus {
    /** No user submission row exists for any submission of the challenge. */
    NotStarted = "notStarted",
    /** At least one user submission row exists but has not been submitted (no attempt) yet. */
    InProgress = "inProgress",
    /** Every submission has been submitted, but not all of them passed. */
    Failed = "failed",
    /** Every submission has been submitted and passed. */
    Completed = "completed",
}

/** Shape of a single challenge in the progress cache. */
export interface ChallengeSubmissionProgressItem {
    /** Challenge ID. */
    id: string
    /** Sum of the latest-attempt score of each submission (each capped at the submission score). */
    lastScore: number
    /** Maximum possible score for this challenge. */
    maxScore: number
    /** Whether the challenge is completed (every submission submitted and passed). */
    completed: boolean
    /** Lifecycle state: notStarted | inProgress | failed | completed. */
    status: ChallengeProgressStatus
    /** Total number of attempts across all submissions. */
    numAttempts: number
}

/** Cached challenge submission progress for a user enrollment. */
export interface ChallengeSubmissionProgressCacheResult {
    /** Challenges that have been attempted (completed or not). */
    completionTasks: Array<ChallengeSubmissionProgressItem>
}
