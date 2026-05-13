import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when the CV submission row is missing for a job. */
export interface CvSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** `cv_submissions.id` from the job payload. */
    cvSubmissionId: string
}

/** Thrown when no CV submission matches the job (e.g. wrong id or status). */
export class CvSubmissionNotFoundException extends AbstractException {
    constructor({
        cvSubmissionId,
        originalError,
    }: CvSubmissionNotFoundExceptionMetadata) {
        super(
            "CV submission not found",
            "CV_SUBMISSION_NOT_FOUND_EXCEPTION",
            {
                cvSubmissionId,
                originalError,
            },
        )
    }
}
