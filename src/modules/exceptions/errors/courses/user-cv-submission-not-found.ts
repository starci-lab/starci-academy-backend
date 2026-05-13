import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a user CV submission id does not exist or is not owned by the user. */
export interface UserCVSubmissionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** `cv_submissions.id`. */
    id: string
}

/** Thrown when no user CV submission matches the requested id. */
export class UserCVSubmissionNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: UserCVSubmissionNotFoundExceptionMetadata) {
        super(
            "User CV submission not found",
            "USER_CV_SUBMISSION_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
