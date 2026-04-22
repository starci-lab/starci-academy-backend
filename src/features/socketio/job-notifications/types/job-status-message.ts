import type {
    JobStatus,
} from "@modules/databases"

export interface JobStatusUpdatedSocketIoMessage {
    jobId: string
    status: JobStatus
    error?: string
}

