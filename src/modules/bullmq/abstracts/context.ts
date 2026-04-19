import { JobEntity } from "@modules/databases"

export interface JobContext<T> {
    payload: T
    queueName?: string
    job: JobEntity
}

export interface JobExtendedContext<T, E> extends JobContext<T> {
    executionResult: E
}