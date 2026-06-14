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

/** Metadata when a job write is rejected because the fencing token moved on. */
export interface JobFencedOutExceptionMetadata extends AbstractExceptionMetadata {
    /** The job id. */
    id: string
    /** The token the caller expected to still own. */
    expectedFencingToken: number
}

/**
 * Thrown when a guarded job write (advance step / complete) affects 0 rows because
 * the row's `fencing_token` moved past `expectedFencingToken` — i.e. this worker is a
 * zombie whose lease was reassigned. The caller must abort QUIETLY, not fail the job
 * (a newer claimant owns it).
 */
export class JobFencedOutException extends AbstractException {
    constructor(
        {
            id,
            expectedFencingToken,
            originalError,
        }: JobFencedOutExceptionMetadata,
    ) {
        super(
            "Job fenced out — a newer worker owns this job",
            "JOB_FENCED_OUT_EXCEPTION",
            {
                id,
                expectedFencingToken,
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
