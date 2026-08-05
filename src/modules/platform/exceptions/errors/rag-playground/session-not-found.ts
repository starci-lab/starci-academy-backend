import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link RagPlaygroundSessionNotFoundException}. */
export interface RagPlaygroundSessionNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The session id that has no indexed source (never indexed, or cleaned up idle). */
    sessionId: string
}

/**
 * The RAG Playground session has no indexed source -- the visitor must
 * (re-)index a code source before asking a question. Also thrown when the
 * session was dropped by the idle cleanup cron.
 */
export class RagPlaygroundSessionNotFoundException extends AbstractException {
    /**
     * @param metadata - The looked-up session id (+ optional original error).
     */
    constructor(
        {
            sessionId,
            originalError,
        }: RagPlaygroundSessionNotFoundExceptionMetadata,
    ) {
        super(
            "RAG Playground session not found — index a code source first",
            "RAG_PLAYGROUND_SESSION_NOT_FOUND_EXCEPTION",
            {
                sessionId,
                originalError,
            },
        )
    }
}
