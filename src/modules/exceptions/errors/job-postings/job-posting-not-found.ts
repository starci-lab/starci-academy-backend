import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a job posting lookup that found no matching row. */
export interface JobPostingNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Primary key looked up, if provided. */
    id?: string
    /** Display slug looked up, if provided. */
    displayId?: string
}

/** Thrown when a job posting cannot be resolved by `id` or `displayId`. */
export class JobPostingNotFoundException extends AbstractException {
    constructor(
        {
            id,
            displayId,
            originalError,
        }: JobPostingNotFoundExceptionMetadata,
    ) {
        super(
            "Job posting not found",
            "JOB_POSTING_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
