import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Raw model text that failed to parse into per-criteria JSON. */
export interface ParsingCriteriaResultsFromModelTextExceptionMetadata extends AbstractExceptionMetadata {
    text?: string
}

/**
 * Stops grading when per-criteria JSON cannot be extracted — otherwise criteria rows would
 * be invented.
 */
export class ParsingCriteriaResultsFromModelTextException extends AbstractException {
    constructor({
        text,
        originalError,
    }: ParsingCriteriaResultsFromModelTextExceptionMetadata) {
        super(
            "Could not parse per-criteria grading JSON from model response",
            "PARSING_CRITERIA_RESULTS_FROM_MODEL_TEXT_EXCEPTION",
            {
                text,
                originalError,
            },
        )
    }
}
