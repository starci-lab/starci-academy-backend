import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a `splitCvFromText` call with no text to split. */
export type CvSplitEmptyTextExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when `splitCvFromText` is called with empty (or whitespace-only)
 * pasted text -- there is nothing to split into blocks.
 */
export class CvSplitEmptyTextException extends AbstractException {
    constructor({
        originalError,
    }: CvSplitEmptyTextExceptionMetadata) {
        super(
            "Cannot split an empty CV text into blocks.",
            "CV_SPLIT_EMPTY_TEXT_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
