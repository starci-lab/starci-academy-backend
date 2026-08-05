import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Foundation index whose mount path was missing. */
export interface FoundationPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Resolved `orderIndex` under a category that has no matching entry in `paths`. */
    foundationIndex: number
}

/**
 * No foundation item path is available in the resolved `paths` list for the given index.
 */
export class FoundationPathNotFoundException extends AbstractException {
    constructor(
        {
            foundationIndex,
            originalError,
        }: FoundationPathNotFoundExceptionMetadata,
    ) {
        super(
            `Foundation path not found for index ${foundationIndex}`,
            "FOUNDATION_PATH_NOT_FOUND_EXCEPTION",
            {
                foundationIndex,
                originalError,
            },
        )
    }
}
