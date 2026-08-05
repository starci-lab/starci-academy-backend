import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV `.tex` -> PDF compile that failed under `tectonic`. */
export type CvLatexCompileFailedExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when `tectonic` fails to compile a CV's `.tex` source into a PDF -- a
 * LaTeX error in the (possibly user-edited) source, a missing package the bundle
 * can't fetch, or the engine exiting non-zero. The original stderr is carried in
 * `originalError` so the surface can show the compile log.
 */
export class CvLatexCompileFailedException extends AbstractException {
    constructor({
        originalError,
    }: CvLatexCompileFailedExceptionMetadata) {
        super(
            "Failed to compile CV LaTeX into a PDF.",
            "CV_LATEX_COMPILE_FAILED_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
