import type {
    JobStatus,
} from "@modules/databases"

/** Job status updated socket io message. */
export interface JobStatusUpdatedSocketIoMessage {
    /** The job id. */
    jobId: string
    /** The challenge submission id. */
    challengeSubmissionId?: string
    /** The job status. */
    status: JobStatus
    /** The error message. */
    error?: string
}

