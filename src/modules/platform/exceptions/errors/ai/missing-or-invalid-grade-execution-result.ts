import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Grade payload the complete-step expected -- logged when it is missing or the wrong shape. */
export interface MissingOrInvalidGradeExecutionResultExceptionMetadata extends AbstractExceptionMetadata {
    grade?: unknown
}

/**
 * Aborts the grade complete-step so a malformed model result cannot be persisted as a
 * score.
 */
export class MissingOrInvalidGradeExecutionResultException extends AbstractException {
    constructor({
        grade,
        originalError,
    }: MissingOrInvalidGradeExecutionResultExceptionMetadata) {
        super(
            "Missing or invalid grade execution result for complete step",
            "MISSING_OR_INVALID_GRADE_EXECUTION_RESULT_EXCEPTION",
            {
                grade,
                originalError,
            },
        )
    }
}
