import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a missing coding submission lookup. */
export interface CodingSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The submission id that did not resolve. */
    codingSubmissionId: string
}

/**
 * Thrown when the judging worker cannot find the `coding_submissions` row the
 * job payload references (e.g. it was deleted before the job ran).
 */
export class CodingSubmissionNotFoundException extends AbstractException {
    constructor({
        codingSubmissionId,
        originalError,
    }: CodingSubmissionNotFoundExceptionMetadata) {
        super(
            `Coding submission "${codingSubmissionId}" was not found.`,
            "CODING_SUBMISSION_NOT_FOUND_EXCEPTION",
            {
                codingSubmissionId,
                originalError,
            },
        )
    }
}
