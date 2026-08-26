import type {
    AbstractExceptionMetadata
} from "../abstract"
import {
    AbstractException
} from "../abstract"

/** Evidence threshold facts retained with a rejected AI evaluation. */
export interface ChallengeEvaluationLowConfidenceExceptionMetadata extends AbstractExceptionMetadata {
  confidence: number;
  threshold: number;
}

/** Prevents incomplete AI evidence from being converted into a platform decision. */
export class ChallengeEvaluationLowConfidenceException extends AbstractException {
    constructor({
        confidence,
        threshold,
        originalError,
    }: ChallengeEvaluationLowConfidenceExceptionMetadata) {
        super(
            "Challenge evaluation evidence confidence is below the platform threshold",
            "CHALLENGE_EVALUATION_LOW_CONFIDENCE_EXCEPTION",
            {
                confidence,
                threshold,
                originalError,
            },
        )
    }
}
