import type {
    JobCategory,
    JobStatus,
    ActionType,
} from "@modules/databases"

/** Job status updated socket io message. */
export interface JobStatusUpdatedSocketIoMessage {
    /** The job id. */
    jobId: string
    /** The challenge submission id. */
    challengeSubmissionId?: string
    /** Lightweight category used by FE to render the correct flow. */
    category?: JobCategory
    /** Domain action persisted on the job row. */
    actionType?: ActionType
    /** The job status. */
    status: JobStatus
    /** The error message. */
    error?: string
}

