import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeSeedStepViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
    stepIndex: number
}

/**
 * Vietnamese challenge markdown has no step matching an English step index.
 */
export class ChallengeSeedStepViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            stepIndex,
            originalError,
        }: ChallengeSeedStepViMissingExceptionMetadata,
    ) {
        super(
            `Challenge seed: step ${stepIndex} not found in vi.md Steps (course ${courseIndex}, module ${moduleIndex}, challenge ${challengeIndex})`,
            "CHALLENGE_SEED_STEP_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
                stepIndex,
                originalError,
            },
        )
    }
}
