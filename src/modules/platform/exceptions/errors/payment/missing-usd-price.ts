import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an international checkout attempted without a configured USD price. */
export interface MissingUsdPriceExceptionMetadata extends AbstractExceptionMetadata {
    /** Provider that requires a USD price (Stripe / PayPal / NOWPayments). */
    paymentType: string
    /** Course id when the checkout is a course enrollment (omitted for AI purchases). */
    courseId?: string
    /** AI subscription tier when the checkout is an AI purchase (omitted for courses). */
    tier?: string
}

/**
 * Thrown when an international gateway checkout (Stripe / PayPal / NOWPayments) is
 * requested but no USD price is configured for the item. We never silently charge
 * the VND amount as USD — the operator must set an explicit USD price first.
 */
export class MissingUsdPriceException extends AbstractException {
    constructor({
        paymentType,
        courseId,
        tier,
        originalError,
    }: MissingUsdPriceExceptionMetadata) {
        super(
            "No USD price configured for this international checkout.",
            "MISSING_USD_PRICE_EXCEPTION",
            {
                paymentType,
                courseId,
                tier,
                originalError,
            },
        )
    }
}
