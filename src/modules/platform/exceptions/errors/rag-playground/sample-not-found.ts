import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link RagPlaygroundSampleNotFoundException}. */
export interface RagPlaygroundSampleNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The unknown sample id that was requested. */
    sampleId: string
}

/**
 * The RAG Playground curated sample catalog has no entry for the requested
 * id — the visitor passed an unknown `sampleId` when indexing via
 * `RagPlaygroundSourceKind.Sample`.
 */
export class RagPlaygroundSampleNotFoundException extends AbstractException {
    /**
     * @param metadata - The unknown sample id (+ optional original error).
     */
    constructor(
        {
            sampleId,
            originalError,
        }: RagPlaygroundSampleNotFoundExceptionMetadata,
    ) {
        super(
            `RAG Playground sample not found: ${sampleId}`,
            "RAG_PLAYGROUND_SAMPLE_NOT_FOUND_EXCEPTION",
            {
                sampleId,
                originalError,
            },
        )
    }
}
