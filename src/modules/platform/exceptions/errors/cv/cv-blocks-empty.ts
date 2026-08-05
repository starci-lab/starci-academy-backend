import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV-blocks operation that received an empty blocks array. */
export interface CvBlocksEmptyExceptionMetadata extends AbstractExceptionMetadata {
    /** The operation that requires a non-empty array (e.g. `"tailor"`). */
    op: string
}

/**
 * Thrown when a CV-blocks operation is called with an empty (or non-array)
 * blocks array -- there is nothing to operate on.
 */
export class CvBlocksEmptyException extends AbstractException {
    constructor({
        op,
        originalError,
    }: CvBlocksEmptyExceptionMetadata) {
        super(
            "CV blocks array is empty.",
            "CV_BLOCKS_EMPTY_EXCEPTION",
            {
                op,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
