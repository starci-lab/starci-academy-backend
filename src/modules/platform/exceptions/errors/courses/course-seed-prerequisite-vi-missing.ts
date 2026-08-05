import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** EN prerequisite that had no VI counterpart during course seed. */
export interface CourseSeedPrerequisiteViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    orderIndex: number
}

/**
 * Vietnamese course markdown has no prerequisite bullet matching an English line order.
 */
export class CourseSeedPrerequisiteViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            orderIndex,
            originalError,
        }: CourseSeedPrerequisiteViMissingExceptionMetadata,
    ) {
        super(
            `Course seed: Prerequisites line order ${orderIndex} missing in vi.md (course ${courseIndex})`,
            "COURSE_SEED_PREREQUISITE_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                orderIndex,
                originalError,
            },
        )
    }
}
