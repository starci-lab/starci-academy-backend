import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata identifying the legacy CV that cannot safely inherit a target level. */
export interface CvTargetLevelRequiredExceptionMetadata extends AbstractExceptionMetadata {
    cvGenerationId: string
}

/** Thrown when a legacy CV without a target bar is revised without selecting one. */
export class CvTargetLevelRequiredException extends AbstractException {
    constructor({ cvGenerationId, originalError }: CvTargetLevelRequiredExceptionMetadata) {
        super(
            "A target level is required to revise this CV.",
            "CV_TARGET_LEVEL_REQUIRED_EXCEPTION",
            {
                cvGenerationId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
