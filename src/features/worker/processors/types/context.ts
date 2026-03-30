import {
    JobEntity,
} from "@modules/databases"

/** Context for a job. */
export interface JobContext<T> {
    /** The payload of the job. */
    payload: T
    /** BullMQ queue name (if available). */
    queueName?: string
    /** The job entity. */
    job: JobEntity
}