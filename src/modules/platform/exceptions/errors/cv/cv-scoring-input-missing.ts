import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV-scoring call that supplied neither input source. */
export type CvScoringInputMissingExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when {@link CvScoringService.score} is called with neither
 * `structuredData` nor `cvText` populated — there is nothing to grade.
 */
export class CvScoringInputMissingException extends AbstractException {
    constructor({
        originalError,
    }: CvScoringInputMissingExceptionMetadata) {
        super(
            "CV scoring requires either structuredData or cvText.",
            "CV_SCORING_INPUT_MISSING_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
