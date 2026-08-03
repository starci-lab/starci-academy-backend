import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV-related model reply that failed JSON parsing. */
export interface CvModelOutputParseExceptionMetadata extends AbstractExceptionMetadata {
    /** Which CV pipeline stage was parsing the reply (`"compose"` | `"score"` | `"tailor"` | `"split"` | `"rewrite"`). */
    stage: string
}

/**
 * Thrown when a CV-related LLM reply cannot be `JSON.parse`d after extracting
 * the JSON block — the model drifted from the STRICT-JSON output contract.
 * The original parse error is preserved via `originalError` for debugging.
 */
export class CvModelOutputParseException extends AbstractException {
    constructor({
        stage,
        originalError,
    }: CvModelOutputParseExceptionMetadata) {
        super(
            "Failed to parse CV model output JSON.",
            "CV_MODEL_OUTPUT_PARSE_EXCEPTION",
            {
                stage,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
