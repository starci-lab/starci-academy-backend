import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"

/** Thrown when an S3/MinIO file is not found at the expected key. */
export interface FileNotExistsExceptionMetadata extends AbstractExceptionMetadata {
    key: string
}

/** Fails when the S3/MinIO object is missing -- callers must not parse an empty stand-in. */
export class FileNotExistsException extends AbstractException {
    constructor(
        { key, originalError }: FileNotExistsExceptionMetadata
    ) {
        super(
            `File not found at key "${key}".`,
            "FILE_NOT_EXISTS_EXCEPTION",
            {
                key,
                originalError,
            }
        )
    }
}

/** Thrown when a CV submission attempt cannot be found. */
export interface CvSubmissionAttemptNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    cvSubmissionAttemptId: string
}

/** Fails CV-pipeline steps when the attempt row is gone. */
export class CvSubmissionAttemptNotFoundException extends AbstractException {
    constructor(
        { cvSubmissionAttemptId, originalError }: CvSubmissionAttemptNotFoundExceptionMetadata
    ) {
        super(
            `CV submission attempt "${cvSubmissionAttemptId}" not found.`,
            "CV_SUBMISSION_ATTEMPT_NOT_FOUND_EXCEPTION",
            {
                cvSubmissionAttemptId,
                originalError,
            }
        )
    }
}
