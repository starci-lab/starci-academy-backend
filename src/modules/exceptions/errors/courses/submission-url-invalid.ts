import type {
    SubmissionType,
} from "@modules/databases"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface SubmissionUrlInvalidExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    submissionType?: SubmissionType
    url?: string
}

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
