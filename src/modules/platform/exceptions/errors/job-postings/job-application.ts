import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata identifying a posting that rejects internal applications. */
export interface JobPostingDoesNotAcceptInternalApplicationsExceptionMetadata
    extends AbstractExceptionMetadata {
    /** Posting that was not configured for internal applications. */
    jobPostingId: string
}

/** Thrown when an application targets an external, email, or expired posting. */
export class JobPostingDoesNotAcceptInternalApplicationsException extends AbstractException {
    constructor({
        jobPostingId,
        originalError,
    }: JobPostingDoesNotAcceptInternalApplicationsExceptionMetadata) {
        super(
            "Job posting does not accept internal applications",
            "JOB_POSTING_DOES_NOT_ACCEPT_INTERNAL_APPLICATIONS_EXCEPTION",
            {
                jobPostingId,
                originalError,
            },
        )
    }
}

/** Metadata identifying an unauthorized applicant-list request. */
export interface JobApplicationsForbiddenExceptionMetadata extends AbstractExceptionMetadata {
    /** Posting whose applications were requested. */
    jobPostingId: string
    /** Caller denied access to the applications. */
    userId: string
}

/** Thrown when a caller does not own the requested posting. */
export class JobApplicationsForbiddenException extends AbstractException {
    constructor({
        jobPostingId,
        userId,
        originalError,
    }: JobApplicationsForbiddenExceptionMetadata) {
        super(
            "Only the posting owner can view its applications",
            "JOB_APPLICATIONS_FORBIDDEN_EXCEPTION",
            {
                jobPostingId,
                userId,
                originalError,
            },
        )
    }
}
