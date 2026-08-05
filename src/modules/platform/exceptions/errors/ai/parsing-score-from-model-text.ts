import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Raw model text that failed to parse into a grade score. */
export interface ParsingScoreFromModelTextExceptionMetadata extends AbstractExceptionMetadata {
    text?: string
}

/** Stops grading when the overall score JSON cannot be extracted from the model reply. */
export class ParsingScoreFromModelTextException extends AbstractException {
    constructor({
        text,
        originalError,
    }: ParsingScoreFromModelTextExceptionMetadata) {
        super(
            "Could not parse grading JSON from model response",
            "PARSING_SCORE_FROM_MODEL_TEXT_EXCEPTION",
            {
                text,
                originalError,
            },
        )
    }
}

/** Raw score value the model returned that is not a usable number. */
export interface InvalidModelGradeScoreExceptionMetadata extends AbstractExceptionMetadata {
    rawValue?: unknown
}

/**
 * Rejects an out-of-range or non-numeric model score so it is never written as the
 * learner's grade.
 */
export class InvalidModelGradeScoreException extends AbstractException {
    constructor({
        rawValue,
        originalError,
    }: InvalidModelGradeScoreExceptionMetadata) {
        super(
            "Invalid score returned by grading model",
            "INVALID_MODEL_GRADE_SCORE_EXCEPTION",
            {
                rawValue,
                originalError,
            },
        )
    }
}
