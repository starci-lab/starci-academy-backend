import type {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import type {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import type {
    DiscountReason,
} from "@modules/databases/postgresql/primary/enums/discount-reason"
import type {
    InstallmentOption,
} from "../installment-plan/types"

/** Whether an array is a set of independent offers or one checkout order. */
export enum CoursePriceQuoteIntent {
    /** Price each requested course independently for catalog or detail discovery. */
    Discovery = "discovery",
    /** Price the de-duplicated request as one purchasable order. */
    Checkout = "checkout",
}

/** Inputs accepted by the canonical course-price quote engine. */
export interface QuoteCoursePricesParams {
    userId: string
    courseIds: Array<string>
    intent: CoursePriceQuoteIntent
    voucherCode?: string
    installmentMonths?: number
}

/** One canonical priced course line. */
export interface CoursePriceQuoteLine {
    course: CourseEntity
    listVnd: number
    phaseVnd: number
    chargedVnd: number
    listUsd: number | null
    phaseUsd: number | null
    chargedUsd: number | null
    loyaltyDiscountPercent: number
    bundleDiscountPercent: number
    displayDiscountPercent: number
    discountReason: DiscountReason
    enrolledCount: number
    pricingPhase: PricingPhase
    nextPhase: PricingPhase | null
    seatsRemainingInCurrentPhase: number | null
    nextPhasePriceVnd: number | null
    nextPhasePriceUsd: number | null
}

/** Params for {@link CoursePriceQuoteService.priceLine} -- the pre-discount line fields plus the pricing intent. */
export type PriceCourseLineParams = Pick<
    CoursePriceQuoteLine,
    | "course"
    | "loyaltyDiscountPercent"
    | "bundleDiscountPercent"
    | "displayDiscountPercent"
    | "discountReason"
    | "enrolledCount"
> & {
    intent: CoursePriceQuoteIntent
}

/** Canonical quote result consumed by reads and checkout mutations. */
export interface CoursePriceQuoteResult {
    lines: Array<CoursePriceQuoteLine>
    totalListVnd: number
    totalPhaseVnd: number
    totalChargedVnd: number
    totalListUsd: number | null
    totalPhaseUsd: number | null
    totalChargedUsd: number | null
    savingsVnd: number
    bundleDiscountPercent: number
    itemCount: number
    voucherDiscountedPriceVnd: number | null
    voucherDiscountedPriceUsd: number | null
    installmentOptions: Array<InstallmentOption>
    selectedInstallment: InstallmentOption | null
}

/** Params for {@link getCoursePricingPhaseRow}. */
export interface GetCoursePricingPhaseRowParams {
    course: CourseEntity
    phase: PricingPhase
}

/** Params for resolving integer VND amount for a course tier. */
export interface ResolveCourseAmountVndParams {
    /** Course with `pricingPhases` loaded; the active phase decides the charged price. */
    course: CourseEntity
    /** Loyalty discount percent (0-100) to apply to the resolved base price. Default 0. */
    discountPercent?: number
    /**
     * Price a SPECIFIC phase instead of the course's current phase -- used to preview
     * a future tier (e.g. "price rises to X" scarcity). Defaults to the current phase.
     */
    phase?: PricingPhase
}

/** Params for resolving the USD (dollars) amount for a course tier (international gateways). */
export interface ResolveCourseAmountUsdParams {
    /** Course with `pricingPhases` loaded; the active phase decides the charged USD price. */
    course: CourseEntity
    /** Loyalty discount percent (0-100) to apply to the resolved base price. Default 0. */
    discountPercent?: number
    /**
     * Price a SPECIFIC phase instead of the course's current phase -- used to preview
     * a future tier (e.g. "price rises to X" scarcity). Defaults to the current phase.
     */
    phase?: PricingPhase
}
