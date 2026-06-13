import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link AiLabEvalSetNotFoundException}. */
export interface AiLabEvalSetNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the eval set that was looked up. */
    evalSetId: string
}

/**
 * The requested AI Lab eval set does not exist in the primary database.
 */
export class AiLabEvalSetNotFoundException extends AbstractException {
    /**
     * @param metadata - Looked-up eval set id (+ optional original error).
     */
    constructor(
        {
            evalSetId,
            originalError,
        }: AiLabEvalSetNotFoundExceptionMetadata,
    ) {
        super(
            `AI Lab eval set not found: ${evalSetId}`,
            "AI_LAB_EVAL_SET_NOT_FOUND_EXCEPTION",
            {
                evalSetId,
                originalError,
            },
        )
    }
}
