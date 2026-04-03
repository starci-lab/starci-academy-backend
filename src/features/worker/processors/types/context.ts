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

export type JobExtendedContext<T, E> = JobContext<T> & {
    /** The extended context of the job. */
    extended?: E
}