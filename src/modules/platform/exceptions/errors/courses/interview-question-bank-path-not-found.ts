import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link InterviewQuestionBankPathNotFoundException}. */
export interface InterviewQuestionBankPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Zero-based bank index that could not be resolved on the mount. */
    interviewQuestionBankIndex: number
}

/**
 * No mock-interview question bank path is available in the resolved `paths` list for
 * the given index (`courses/{course}/mock-interview/{bankIndex}-{slug}`).
 */
export class InterviewQuestionBankPathNotFoundException extends AbstractException {
    constructor(
        {
            interviewQuestionBankIndex,
            originalError,
        }: InterviewQuestionBankPathNotFoundExceptionMetadata,
    ) {
        super(
            `Interview question bank path not found for index ${interviewQuestionBankIndex}`,
            "INTERVIEW_QUESTION_BANK_PATH_NOT_FOUND_EXCEPTION",
            {
                interviewQuestionBankIndex,
                originalError,
            },
        )
    }
}
