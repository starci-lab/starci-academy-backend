import type {
    PricingPhase,
} from "@modules/databases"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a non-Regular tier has no configured price row or invalid amount. */
export interface PricingPhaseNoPriceExceptionMetadata extends AbstractExceptionMetadata {
    courseId: string
    phase: PricingPhase
}

/** Thrown when the requested pricing tier has no valid `price` on `pricing_phases`. */
export class PricingPhaseNoPriceException extends AbstractException {
    constructor({
        courseId,
        phase,
        originalError,
    }: PricingPhaseNoPriceExceptionMetadata) {
        super(
            `No price configured for tier ${phase}.`,
            "PRICING_PHASE_NO_PRICE_EXCEPTION",
            {
                courseId,
                phase,
                originalError,
            },
        )
    }
}
