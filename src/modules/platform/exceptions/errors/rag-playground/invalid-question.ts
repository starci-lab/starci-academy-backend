import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * The RAG Playground question is empty (after trimming) — nothing to ask.
 */
export class RagPlaygroundInvalidQuestionException extends AbstractException {
    /**
     * @param metadata - Optional original error only (no extra fields needed).
     */
    constructor(
        {
            originalError,
        }: AbstractExceptionMetadata = {
        },
    ) {
        super(
            "Câu hỏi không được để trống",
            "RAG_PLAYGROUND_INVALID_QUESTION_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
