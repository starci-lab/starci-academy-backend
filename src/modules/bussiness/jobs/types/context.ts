import {
    JobEntity 
} from "@modules/databases"

export interface JobContext<T> {
    payload: T
    queueName?: string
    job: JobEntity
}

export interface JobExtendedContext<T, E> extends JobContext<T> {
    extended: E
}
/**
 * Abstract step service.
 */
export abstract class AbstractStepService<T, E> {
    /**
     * The index of the step.
     */
    abstract stepIndex: number
    /**
     * The name of the step.
     */
    abstract stepName: string
    /**
     * Process the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    abstract process(context: JobExtendedContext<T, E>): Promise<void>
}