import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV-block operation given a missing block. */
export interface CvBlockNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** The operation that required the block (e.g. `"rewrite"`). */
    op: string
}

/**
 * Thrown when a CV-block operation is called with a missing/non-object
 * `block` -- there is nothing to operate on.
 */
export class CvBlockNotFoundException extends AbstractException {
    constructor({
        op,
        originalError,
    }: CvBlockNotFoundExceptionMetadata) {
        super(
            "CV block not found.",
            "CV_BLOCK_NOT_FOUND_EXCEPTION",
            {
                op,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
