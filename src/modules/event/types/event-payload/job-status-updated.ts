import {
    JobStatus 
} from "@modules/databases"
/**
 * Payload emitted whenever a job changes state.
 *
 * Keep this payload stable and generic so it can be consumed by
 * different queues / job types without tight coupling.
 */
export interface JobStatusUpdatedEventPayload {
    /** The job ID. */
    jobId: string
    /** The job type. */
    jobType?: string
    /** The job status. */
    status: JobStatus
    /** The error message. */
    error?: string
}

