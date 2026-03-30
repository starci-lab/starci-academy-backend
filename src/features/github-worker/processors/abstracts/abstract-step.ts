import {
    JobContext 
} from "../types"

/**
 * Abstract step service.
 */
export abstract class AbstractStepService<T> {
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
    abstract process(context: JobContext<T>): Promise<void>
}