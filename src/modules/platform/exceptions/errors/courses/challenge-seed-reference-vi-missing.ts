import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** EN reference order/alias that had no VI counterpart during challenge seed. */
export interface ChallengeSeedReferenceViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
    orderIndex: number
    alias: string
}

/**
 * Vietnamese challenge markdown has no reference row matching an English reference order.
 */
export class ChallengeSeedReferenceViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            orderIndex,
            alias,
            originalError,
        }: ChallengeSeedReferenceViMissingExceptionMetadata,
    ) {
        super(
            `Challenge seed: reference order ${orderIndex} (${alias}) missing in vi.md References (course ${courseIndex}, module ${moduleIndex}, challenge ${challengeIndex})`,
            "CHALLENGE_SEED_REFERENCE_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
                orderIndex,
                alias,
                originalError,
            },
        )
    }
}
