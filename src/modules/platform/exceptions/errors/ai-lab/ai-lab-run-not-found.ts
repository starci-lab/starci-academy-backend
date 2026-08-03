import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link AiLabRunNotFoundException}. */
export interface AiLabRunNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the run that was looked up. */
    runId: string
}

/**
 * The requested AI Lab run does not exist in the primary database.
 */
export class AiLabRunNotFoundException extends AbstractException {
    /**
     * @param metadata - Looked-up run id (+ optional original error).
     */
    constructor(
        {
            runId,
            originalError,
        }: AiLabRunNotFoundExceptionMetadata,
    ) {
        super(
            `AI Lab run not found: ${runId}`,
            "AI_LAB_RUN_NOT_FOUND_EXCEPTION",
            {
                runId,
                originalError,
            },
        )
    }
}
