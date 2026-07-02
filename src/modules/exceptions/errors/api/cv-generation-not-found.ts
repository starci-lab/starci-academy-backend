import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when the CV generation run is missing (or not the caller's). */
export interface CvGenerationNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** `cv_generations.id` that was requested. */
    cvGenerationId: string
}

/** Thrown when no CV generation run matches the id for the calling user. */
export class CvGenerationNotFoundException extends AbstractException {
    constructor({
        cvGenerationId,
        originalError,
    }: CvGenerationNotFoundExceptionMetadata) {
        super(
            "CV generation not found",
            "CV_GENERATION_NOT_FOUND_EXCEPTION",
            {
                cvGenerationId,
                originalError,
            },
        )
    }
}
