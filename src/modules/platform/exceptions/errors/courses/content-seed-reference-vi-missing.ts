import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** EN reference that had no VI counterpart during content seed. */
export interface ContentSeedReferenceViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    orderIndex: number
    alias: string
}

/**
 * Vietnamese content markdown has no reference row matching an English reference order.
 */
export class ContentSeedReferenceViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            orderIndex,
            alias,
            originalError,
        }: ContentSeedReferenceViMissingExceptionMetadata,
    ) {
        super(
            `Content seed: reference order ${orderIndex} (${alias}) missing in vi.md References (course ${courseIndex}, module ${moduleIndex}, content ${contentIndex})`,
            "CONTENT_SEED_REFERENCE_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                orderIndex,
                alias,
                originalError,
            },
        )
    }
}
