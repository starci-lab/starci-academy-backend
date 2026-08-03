import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ParsingCriteriaResultsFromModelTextExceptionMetadata extends AbstractExceptionMetadata {
    text?: string
}

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
