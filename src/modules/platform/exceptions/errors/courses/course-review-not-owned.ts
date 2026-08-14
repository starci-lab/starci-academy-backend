import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a caller reaches for a review that belongs to somebody else. */
export interface CourseReviewNotOwnedExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    userId?: string
}

/**
 * Thrown when the caller is not the author of the review they are editing or deleting.
 *
 * This names the refusal rather than answering not-found, and AUTHZ-4 is why that is the right
 * choice HERE: a course's reviews are listed publicly, so the row's existence is not a secret and
 * hiding it would only send a legitimate author hunting for a bug that is not there.
 */
export class CourseReviewNotOwnedException extends AbstractException {
    constructor({
        id,
        userId,
        originalError,
    }: CourseReviewNotOwnedExceptionMetadata) {
        super(
            "Course review does not belong to this user",
            "COURSE_REVIEW_NOT_OWNED_EXCEPTION",
            {
                id,
                userId,
                originalError,
            },
        )
    }
}
