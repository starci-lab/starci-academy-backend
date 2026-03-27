import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"
/** Metadata for job not found. */
export interface JobNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    jobId: string
}

/** Thrown when job cannot be found. */
export class JobNotFoundException extends AbstractException {
    constructor(
        { jobId, originalError }: JobNotFoundExceptionMetadata
    ) {
        super(
            "Job not found", 
            "JOB_NOT_FOUND_EXCEPTION", 
            {
                jobId,
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