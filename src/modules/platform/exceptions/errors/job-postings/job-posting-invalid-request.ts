import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a `submitJobPosting` request that fails a cross-field invariant. */
export interface JobPostingInvalidRequestExceptionMetadata extends AbstractExceptionMetadata {
    /** Which invariant was violated (for log grouping / client messaging). */
    reason: JobPostingInvalidRequestReason
}

/**
 * The specific cross-field invariant a `submitJobPosting` request violated.
 * Each value corresponds to one `class-validator` decorators cannot express
 * (they depend on more than one sibling field).
 */
export enum JobPostingInvalidRequestReason {
    /** Neither `companyId` nor `newCompany` was provided. */
    MissingCompany = "missing_company",
    /** Both `companyId` and `newCompany` were provided (exactly one is required). */
    AmbiguousCompany = "ambiguous_company",
    /** `applyMethod` is `ExternalUrl` but `applyUrl` was omitted. */
    MissingApplyUrl = "missing_apply_url",
    /** `applyMethod` is `Email` but `applyEmail` was omitted. */
    MissingApplyEmail = "missing_apply_email",
}

/**
 * Thrown when a `submitJobPosting` request fails a cross-field invariant that
 * `class-validator` field decorators cannot express on their own (e.g.
 * "exactly one of companyId / newCompany").
 */
export class JobPostingInvalidRequestException extends AbstractException {
    constructor(
        {
            reason,
            originalError,
        }: JobPostingInvalidRequestExceptionMetadata,
    ) {
        super(
            "Job posting request is invalid",
            "JOB_POSTING_INVALID_REQUEST_EXCEPTION",
            {
                reason,
                originalError,
            },
        )
    }
}
