import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV DOCX render that produced neither a Buffer nor an ArrayBuffer. */
export type CvDocxBuildFailedExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when `html-to-docx` resolves a value that is neither a `Buffer` nor
 * an `ArrayBuffer` — an unexpected library/runtime output shape.
 */
export class CvDocxBuildFailedException extends AbstractException {
    constructor({
        originalError,
    }: CvDocxBuildFailedExceptionMetadata) {
        super(
            "Failed to build DOCX from CV HTML.",
            "CV_DOCX_BUILD_FAILED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
