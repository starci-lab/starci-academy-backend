import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV-related model reply whose parsed JSON has the wrong shape. */
export interface CvModelOutputShapeExceptionMetadata extends AbstractExceptionMetadata {
    /** Which CV pipeline stage validated the shape (`"tailor"` | `"split"` | `"rewrite"`). */
    stage: string
    /** The shape that was required (`"array"` | `"object"`). */
    expected: string
}

/**
 * Thrown when a CV-related LLM reply parses as valid JSON but is not the
 * expected top-level shape (e.g. an object where an array was required) —
 * the model drifted from the STRICT-JSON output contract.
 */
export class CvModelOutputShapeException extends AbstractException {
    constructor({
        stage,
        expected,
        originalError,
    }: CvModelOutputShapeExceptionMetadata) {
        super(
            "CV model output JSON had an unexpected shape.",
            "CV_MODEL_OUTPUT_SHAPE_EXCEPTION",
            {
                stage,
                expected,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
