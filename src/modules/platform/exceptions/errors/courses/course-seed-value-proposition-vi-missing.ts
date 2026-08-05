import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** EN value-proposition entry that had no VI counterpart during course seed. */
export interface CourseSeedValuePropositionViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    orderIndex: number
}

/**
 * Vietnamese course markdown has no value-proposition bullet matching an English line order.
 */
export class CourseSeedValuePropositionViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            orderIndex,
            originalError,
        }: CourseSeedValuePropositionViMissingExceptionMetadata,
    ) {
        super(
            `Course seed: Value Propositions line order ${orderIndex} missing in vi.md (course ${courseIndex})`,
            "COURSE_SEED_VALUE_PROPOSITION_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                orderIndex,
                originalError,
            },
        )
    }
}
