import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link RagPlaygroundImportException}. */
export interface RagPlaygroundImportExceptionMetadata extends AbstractExceptionMetadata {
    /** Human-readable reason the import was rejected (size cap, bad URL, no files, ...). */
    reason: string
}

/**
 * The RAG Playground could not import the requested code source -- an
 * oversized paste, an invalid/non-GitHub URL, a private/missing repo, or a
 * repo with no importable files after the extension/size filters. The
 * `reason` is safe to show directly to the (anonymous) visitor.
 */
export class RagPlaygroundImportException extends AbstractException {
    /**
     * @param metadata - The user-facing rejection reason (+ optional original error).
     */
    constructor(
        {
            reason,
            originalError,
        }: RagPlaygroundImportExceptionMetadata,
    ) {
        super(
            `RAG Playground import failed: ${reason}`,
            "RAG_PLAYGROUND_IMPORT_EXCEPTION",
            {
                reason,
                originalError,
            },
        )
    }
}
