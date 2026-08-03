import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a slug-generation exhaustion failure. */
export interface JobPostingSlugGenerationFailedExceptionMetadata extends AbstractExceptionMetadata {
    /** Base slug (before any random suffix) that could not be made unique. */
    base: string
    /** Number of suffixed attempts made before giving up. */
    attempts: number
}

/**
 * Thrown when a unique `displayId` slug could not be generated for a new job
 * posting or inline-created company after exhausting the retry budget — an
 * astronomically unlikely collision run, surfaced loudly instead of silently
 * persisting a colliding slug.
 */
export class JobPostingSlugGenerationFailedException extends AbstractException {
    constructor(
        {
            base,
            attempts,
            originalError,
        }: JobPostingSlugGenerationFailedExceptionMetadata,
    ) {
        super(
            "Could not generate a unique slug",
            "JOB_POSTING_SLUG_GENERATION_FAILED_EXCEPTION",
            {
                base,
                attempts,
                originalError,
            },
        )
    }
}
