import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a review score falls outside the star scale. */
export interface CourseReviewScoreOutOfRangeExceptionMetadata extends AbstractExceptionMetadata {
    score?: number
    minimum?: number
    maximum?: number
}

/**
 * Thrown when a review score is not a whole star between the bounds.
 *
 * The bounds travel in the metadata rather than only in the message because the client renders the
 * scale and needs to know what it is; a caller that has to parse "between 1 and 5" out of English
 * is a caller that breaks when the sentence is reworded.
 */
export class CourseReviewScoreOutOfRangeException extends AbstractException {
    constructor({
        score,
        minimum,
        maximum,
        originalError,
    }: CourseReviewScoreOutOfRangeExceptionMetadata) {
        super(
            "Course review score is out of range",
            "COURSE_REVIEW_SCORE_OUT_OF_RANGE_EXCEPTION",
            {
                score,
                minimum,
                maximum,
                originalError,
            },
        )
    }
}
