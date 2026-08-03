import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link AiLabPlaygroundNotFoundException}. */
export interface AiLabPlaygroundNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the playground that was looked up. */
    playgroundId: string
}

/**
 * The requested AI Lab playground does not exist in the primary database.
 */
export class AiLabPlaygroundNotFoundException extends AbstractException {
    /**
     * @param metadata - Looked-up playground id (+ optional original error).
     */
    constructor(
        {
            playgroundId,
            originalError,
        }: AiLabPlaygroundNotFoundExceptionMetadata,
    ) {
        super(
            `AI Lab playground not found: ${playgroundId}`,
            "AI_LAB_PLAYGROUND_NOT_FOUND_EXCEPTION",
            {
                playgroundId,
                originalError,
            },
        )
    }
}
