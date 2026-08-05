import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a `tailorCvBlocks` call with no job description. */
export type CvTailorMissingJobDescriptionExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when `tailorCvBlocks` is called with an empty `jobDescription` --
 * there is nothing to tailor the CV toward.
 */
export class CvTailorMissingJobDescriptionException extends AbstractException {
    constructor({
        originalError,
    }: CvTailorMissingJobDescriptionExceptionMetadata) {
        super(
            "Cannot tailor a CV without a job description.",
            "CV_TAILOR_MISSING_JOB_DESCRIPTION_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
