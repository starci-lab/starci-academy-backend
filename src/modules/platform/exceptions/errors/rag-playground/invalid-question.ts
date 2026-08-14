import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an empty RAG Playground question. */
export type RagPlaygroundInvalidQuestionExceptionMetadata = AbstractExceptionMetadata

/**
 * The RAG Playground question is empty (after trimming) -- nothing to ask.
 */
export class RagPlaygroundInvalidQuestionException extends AbstractException {
    /**
     * @param metadata - Optional original error only (no extra fields needed).
     */
    constructor(
        {
            originalError,
        }: RagPlaygroundInvalidQuestionExceptionMetadata = {
        },
    ) {
        super(
            "Câu hỏi không được để trống", // vn-ok: vi-locale string emitted to clients
            "RAG_PLAYGROUND_INVALID_QUESTION_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
