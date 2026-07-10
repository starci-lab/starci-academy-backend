import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a CV-generation step that could not load an upstream step's result. */
export interface CvGenerationStepResultMissingExceptionMetadata extends AbstractExceptionMetadata {
    /** The upstream step key that was expected (`"gather"` | `"compose"` | `"render"`). */
    step: string
    /** The step that failed to load it (`"compose"` | `"score"` | `"render"` | `"complete"`). */
    stage: string
}

/**
 * Thrown when a generate-CV pipeline step (`compose`/`score`/`render`/`complete`)
 * cannot load a required upstream step's persisted execution result — the
 * pipeline steps run strictly in order, so this only fires on a corrupted or
 * skipped step chain.
 */
export class CvGenerationStepResultMissingException extends AbstractException {
    constructor({
        step,
        stage,
        originalError,
    }: CvGenerationStepResultMissingExceptionMetadata) {
        super(
            "Missing an upstream execution result for this CV generation step.",
            "CV_GENERATION_STEP_RESULT_MISSING_EXCEPTION",
            {
                step,
                stage,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
