import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ParsingScoreFromModelTextExceptionMetadata extends AbstractExceptionMetadata {
    text?: string
}

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

export interface InvalidModelGradeScoreExceptionMetadata extends AbstractExceptionMetadata {
    rawValue?: unknown
}

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
