import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface MissingOrInvalidGradeExecutionResultExceptionMetadata extends AbstractExceptionMetadata {
    grade?: unknown
}

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
