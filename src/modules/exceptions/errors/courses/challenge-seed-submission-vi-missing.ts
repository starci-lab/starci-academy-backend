import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ChallengeSeedSubmissionViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
    orderIndex: number
    title: string
}

/**
 * Vietnamese challenge markdown has no submission slot matching an English submission order.
 */
export class ChallengeSeedSubmissionViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            orderIndex,
            title,
            originalError,
        }: ChallengeSeedSubmissionViMissingExceptionMetadata,
    ) {
        super(
            `Challenge seed: submission order ${orderIndex} (${title}) missing in vi.md Submissions (course ${courseIndex}, module ${moduleIndex}, challenge ${challengeIndex})`,
            "CHALLENGE_SEED_SUBMISSION_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
                orderIndex,
                title,
                originalError,
            },
        )
    }
}
