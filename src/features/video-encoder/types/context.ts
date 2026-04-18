import { JobEntity } from "@modules/databases"

export interface JobContext<T> {
    payload: T
    queueName?: string
    job: JobEntity
}

export type JobExtendedContext<T, E> = JobContext<T> & {
    extended?: E
}
