import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface CourseSeedQnaViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    /** 1-based index from `## N.` in English Q&A. */
    orderIndex: number
}

/**
 * Vietnamese course markdown has no Q&A item matching an English `## N.` block.
 */
export class CourseSeedQnaViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            orderIndex,
            originalError,
        }: CourseSeedQnaViMissingExceptionMetadata,
    ) {
        super(
            `Course seed: Q&A item ${orderIndex} missing in vi.md (course ${courseIndex})`,
            "COURSE_SEED_QNA_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                orderIndex,
                originalError,
            },
        )
    }
}
