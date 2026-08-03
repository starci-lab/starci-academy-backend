import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface CourseSeedPricingDataInvalidExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    /** Which part of pricing `data.json` failed validation. */
    field: "originalPrice" | "currentPhase" | "pricingPhases" | "phase"
    /** Raw string when `field` is `phase` or `currentPhase`. */
    invalidValue?: string
}

/**
 * Course root `data.json` has missing or invalid pricing fields.
 */
export class CourseSeedPricingDataInvalidException extends AbstractException {
    constructor(
        {
            courseIndex,
            field,
            invalidValue,
            originalError,
        }: CourseSeedPricingDataInvalidExceptionMetadata,
    ) {
        const suffix = invalidValue !== undefined
            ? `: ${invalidValue}`
            : ""
        super(
            `Course seed: invalid pricing data (${field}) for course index ${courseIndex}${suffix}`,
            "COURSE_SEED_PRICING_DATA_INVALID_EXCEPTION",
            {
                courseIndex,
                field,
                invalidValue,
                originalError,
            },
        )
    }
}
