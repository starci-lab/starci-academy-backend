import {
    CourseEntity,
    PricingPhase,
} from "@modules/databases"
import {
    CourseNoRegularPriceException,
    PricingPhaseNoPriceException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import type {
    ResolveCourseAmountUsdParams,
    ResolveCourseAmountVndParams,
} from "./types"

/**
 * In non-production (local/dev) every course checkout is charged the REAL tiered
 * price divided by this factor, so payment tests (bank transfer / QR) stay cheap
 * while keeping the prices proportional. Production charges the full price.
 * `1.250.000₫ / 100 = 12.500₫` -- still well above the PayOS 2,000₫ minimum even
 * after the max loyalty discount. Gated on `NODE_ENV` via `envConfig().isProduction`.
 */
const LOCAL_TEST_PRICE_DIVISOR = 100

@Injectable()
/**
 * Resolves course checkout amounts in VND from `originalPrice` and `pricing_phases`.
 */
export class CoursePricingService {
    /**
     * Integer VND amount for PayOS / Sepay (Regular -> `originalPrice`, other tiers -> `pricing_phases.price`).
     *
     * @param param - Course with `pricingPhases` loaded and the tier to charge
     * @returns Rounded VND minor units (integer)
     */
    resolveAmountVnd(
        params: ResolveCourseAmountVndParams,
    ): number {
        // full real price for the active tier (with loyalty discount applied)
        const realAmount = this.resolveRealAmountVnd(params)
        // non-production: charge real/100 so live payment tests stay cheap
        if (!envConfig().isProduction) {
            return Math.max(
                1,
                Math.round(realAmount / LOCAL_TEST_PRICE_DIVISOR),
            )
        }
        return realAmount
    }

    /**
     * The LIST (pre-discount) VND price -- the course's `originalPrice` (MSRP /
     * Regular price), used as the struck "before" price in previews so the saving
     * shown is the full list -> charge gap (phase tier + loyalty), not just loyalty.
     * Falls back to the active-tier amount when no list price is set (-> no strike).
     * Mirrors the non-production `/100` test divisor of {@link resolveAmountVnd}.
     *
     * @param param - Course (no discount is applied to the list price).
     * @returns Rounded VND minor units (integer).
     */
    resolveListAmountVnd(
        {
            course,
        }: ResolveCourseAmountVndParams,
    ): number {
        const listPrice = course.originalPrice
        if (listPrice == null || listPrice <= 0) {
            // no list price -> use the active-tier amount so original == discounted (no strike)
            return this.resolveAmountVnd({
                course 
            })
        }
        if (!envConfig().isProduction) {
            return Math.max(1,
                Math.round(listPrice / LOCAL_TEST_PRICE_DIVISOR))
        }
        return listPrice
    }

    /**
     * The LIST (pre-discount) USD price -- the course's `originalPriceUsd`, or null
     * when unset. Struck "before" price for international previews, charm-rounded to
     * x.99 like {@link resolveAmountUsd} (no /100 test divisor for USD).
     *
     * @param param - Course (no discount applied).
     * @returns USD dollar amount, or null when no list USD price.
     */
    resolveListAmountUsd(
        {
            course,
        }: ResolveCourseAmountUsdParams,
    ): number | null {
        const listPriceUsd = course.originalPriceUsd ?? null
        if (listPriceUsd == null) {
            return null
        }
        // USD always charm-rounds to a clean x.99 (no /100 test divisor -- int'l
        // gateways run in sandbox/test mode in dev, so the amount is harmless). VND
        // keeps the /100 divisor because PayOS/Sepay hit real bank rails.
        return this.roundUsdToCharm(listPriceUsd)
    }

    /**
     * Round a USD amount UP to a charm price ending in `.99` (ceil to the next whole
     * dollar − 0.01, floor $0.99): $0.50 -> $0.99, $49.2 -> $49.99, $50 -> $49.99. Keeps
     * the USD price clean (no odd cents) AND identical to the Stripe/PayPal charge
     * (display == charge). Applied in every env so the shown USD is always `x.99`.
     *
     * @param amount - Raw USD dollar amount.
     * @returns Charm-rounded USD (`x.99`).
     */
    private roundUsdToCharm(
        amount: number,
    ): number {
        const whole = Math.max(1,
            Math.ceil(amount))
        return whole - 0.01
    }

    /**
     * The real (production) VND amount for the active tier, loyalty discount
     * applied: Regular -> `course.originalPrice`; any other tier -> the matching
     * `pricing_phases.price`. Throws when the active tier has no valid price
     * (never silently charges 0).
     *
     * @param param - Course with `pricingPhases` loaded and the tier to charge
     * @returns Rounded VND minor units (integer)
     */
    private resolveRealAmountVnd(
        {
            course,
            discountPercent = 0,
            phase,
        }: ResolveCourseAmountVndParams,
    ): number {
        const currentPhase = phase ?? this.getCurrentPricingPhase(course)
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
        const base = pricingPhase?.price
        // a non-Regular tier with no configured price must reject, never charge 0
        if (base == null || base <= 0) {
            throw new PricingPhaseNoPriceException({
                courseId: course.id,
                phase: currentPhase,
            })
        }
        return Math.round(base * (1 - this.clampPercent(discountPercent) / 100))
    }

    /**
     * USD (dollars) amount for international gateways (Stripe / PayPal / NOWPayments),
     * read from the active phase's `priceUsd`. Returns `null` when no USD price is set
     * (e.g. the Regular phase, which only carries a VND `originalPrice`) -- the caller
     * must reject the checkout rather than charge VND as USD.
     *
     * @param param - Course with `pricingPhases` loaded
     * @returns USD dollar amount, or `null` when the active phase has no USD price
     */
    resolveAmountUsd(
        {
            course,
            discountPercent = 0,
            phase,
        }: ResolveCourseAmountUsdParams,
    ): number | null {
        // determine which tier to price (an explicit `phase` previews a future tier)
        const currentPhase = phase ?? this.getCurrentPricingPhase(course)
        // Regular phase has no pricing_phases row -> only a VND originalPrice exists, no USD
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
        // apply the loyalty discount; cents conversion stays in the Stripe service.
        // USD always charm-rounds to x.99 (no /100 divisor -- int'l gateways are
        // sandbox/test in dev, so the amount is harmless).
        const realAmount = base * (1 - this.clampPercent(discountPercent) / 100)
        return this.roundUsdToCharm(realAmount)
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
        // metadata is seeded with the app.yaml default (EarlyBird); fall back to
        // EarlyBird -- NOT Regular -- when absent so the CHARGED tier matches what the
        // UI shows (course.resolver + enroll-step both default to EarlyBird).
        return course.metadata?.currentPhase ?? PricingPhase.EarlyBird
    }

    /**
     * Clamp a discount percent into the valid 0-100 range (floored to an int).
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
