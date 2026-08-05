import {
    JobEntity 
} from "@modules/databases"

/** Context handed to a job step: the decoded queue payload plus the owning job row. */
export interface JobContext<T> {
    /** The decoded BullMQ job payload. */
    payload: T
    /** The BullMQ queue this job was dispatched on, when known. */
    queueName?: string
    /** The `jobs` row backing this run -- steps read/write its progress through it. */
    job: JobEntity
}

/** {@link JobContext} plus per-pipeline state accumulated across steps. */
export interface JobExtendedContext<T, E> extends JobContext<T> {
    /** State a step hands to the next step in the pipeline. */
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