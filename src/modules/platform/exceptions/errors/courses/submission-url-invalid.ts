import type {
    SubmissionType,
} from "@modules/databases/postgresql/primary/enums/submission-type"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Submitted URL that failed validation for the submission type. */
export interface SubmissionUrlInvalidExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    submissionType?: SubmissionType
    url?: string
}

/** Rejects the submit so an unusable URL is never queued for review. */
export class SubmissionUrlInvalidException extends AbstractException {
    constructor({
        id,
        submissionType,
        url,
        originalError,
    }: SubmissionUrlInvalidExceptionMetadata) {
        super(
            "Submission URL does not match the expected format for this submission type",
            "SUBMISSION_URL_INVALID_EXCEPTION",
            {
                id,
                submissionType,
                url,
                originalError,
            },
        )
    }
}
