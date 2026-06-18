import {
    CourseEntity,
    PricingPhase,
} from "@modules/databases"
import {
    CourseNoRegularPriceException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    ResolveCourseAmountUsdParams,
    ResolveCourseAmountVndParams,
} from "./types"
/**
 * Resolves course checkout amounts in VND from `originalPrice` and `pricing_phases`.
 */
@Injectable()
export class CoursePricingService {
    /**
     * Integer VND amount for PayOS / Sepay (Regular → `originalPrice`, other tiers → `pricing_phases.price`).
     *
     * @param param - Course with `pricingPhases` loaded and the tier to charge
     * @returns Rounded VND minor units (integer)
     */
    resolveAmountVnd(
        {
            course,
            discountPercent = 0,
        }: ResolveCourseAmountVndParams,
    ): number {
        const currentPhase = this.getCurrentPricingPhase(course)
        if (currentPhase === PricingPhase.Regular) {
            const priceVnd = course.originalPrice
            if (priceVnd == null || priceVnd <= 0) {
                throw new CourseNoRegularPriceException(
                    {
                        courseId: course.id,
                    },
                )
            }
            // apply the loyalty discount; keep the result an integer minor unit
            return Math.round(priceVnd * (1 - this.clampPercent(discountPercent) / 100))
        }
        const pricingPhase = course.pricingPhases.find(
            (pricingPhase) => pricingPhase.phase === currentPhase,
        )
        const base = pricingPhase?.price ?? 0
        return Math.round(base * (1 - this.clampPercent(discountPercent) / 100))
    }

    /**
     * USD (dollars) amount for international gateways (Stripe / PayPal / NOWPayments),
     * read from the active phase's `priceUsd`. Returns `null` when no USD price is set
     * (e.g. the Regular phase, which only carries a VND `originalPrice`) — the caller
     * must reject the checkout rather than charge VND as USD.
     *
     * @param param - Course with `pricingPhases` loaded
     * @returns USD dollar amount, or `null` when the active phase has no USD price
     */
    resolveAmountUsd(
        {
            course,
            discountPercent = 0,
        }: ResolveCourseAmountUsdParams,
    ): number | null {
        // determine which tier is currently active for this course
        const currentPhase = this.getCurrentPricingPhase(course)
        // Regular phase has no pricing_phases row → only a VND originalPrice exists, no USD
        if (currentPhase === PricingPhase.Regular) {
            return null
        }
        // locate the active phase row and read its USD price (null when unset)
        const pricingPhase = course.pricingPhases.find(
            (pricingPhase) => pricingPhase.phase === currentPhase,
        )
        const base = pricingPhase?.priceUsd ?? null
        if (base == null) {
            return null
        }
        // apply the loyalty discount; cents conversion stays in the Stripe service
        return base * (1 - this.clampPercent(discountPercent) / 100)
    }

    /**
     * Get the current pricing phase of a course.
     *
     * @param course - The course to get the current pricing phase of.
     * @returns The current pricing phase of the course.
     */
    getCurrentPricingPhase(
        course: CourseEntity,
    ): PricingPhase {
        return course.metadata?.currentPhase ?? PricingPhase.Regular
    }

    /**
     * Clamp a discount percent into the valid 0–100 range (floored to an int).
     *
     * @param percent - Raw discount percent.
     * @returns Integer percent in [0, 100].
     */
    private clampPercent(
        percent: number,
    ): number {
        return Math.min(
            100,
            Math.max(
                0,
                Math.floor(percent),
            ),
        )
    }
}
