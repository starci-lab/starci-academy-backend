import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a `cv_blocks` document lookup that found no owned row. */
export interface CvDocumentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the `cv_blocks` row looked up. */
    cvBlocksId: string
}

/**
 * Thrown when an update/render/delete on a `cv_blocks` document finds no row
 * matching both the id and the caller's ownership -- collapsed into one
 * not-found error so ownership is never leaked to the caller.
 */
export class CvDocumentNotFoundException extends AbstractException {
    constructor({
        cvBlocksId,
        originalError,
    }: CvDocumentNotFoundExceptionMetadata) {
        super(
            "CV document not found.",
            "CV_DOCUMENT_NOT_FOUND_EXCEPTION",
            {
                cvBlocksId,
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
