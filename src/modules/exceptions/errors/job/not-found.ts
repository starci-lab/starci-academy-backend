import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"
/** Metadata for job not found. */
export interface JobNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id: string
}

/** Thrown when job cannot be found. */
export class JobNotFoundException extends AbstractException {
    constructor(
        { id, originalError }: JobNotFoundExceptionMetadata
    ) {
        super(
            "Job not found", 
            "JOB_NOT_FOUND_EXCEPTION", 
            {
                id,
                originalError,
            }
        )
    }
}

/** Metadata when no valid selector is provided to target a job. */
export interface JobTargetRequiredExceptionMetadata extends AbstractExceptionMetadata {
    queueName?: string
    bullmqJobId?: string
}

/** Thrown when job target selector is missing (id or queueName+bullmqJobId required). */
export class JobTargetRequiredException extends AbstractException {
    constructor(
        {
            queueName,
            bullmqJobId,
            originalError,
        }: JobTargetRequiredExceptionMetadata,
    ) {
        super(
            "Job target requires id, or queueName + bullmqJobId",
            "JOB_TARGET_REQUIRED_EXCEPTION",
            {
                queueName,
                bullmqJobId,
                originalError,
            },
        )
    }
}

/** Metadata when a pipeline step index has no registered handler. */
export interface StepNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Zero-based step index from the job row. */
    stepIndex: number
}

/** Thrown when `stepMap.get(currentStep)` returns nothing. */
export class StepNotFoundException extends AbstractException {
    constructor({
        stepIndex,
        originalError,
    }: StepNotFoundExceptionMetadata) {
        super(
            `Pipeline step not found for index ${stepIndex}`,
            "STEP_NOT_FOUND_EXCEPTION",
            {
                stepIndex,
                originalError,
            },
        )
    }
}
