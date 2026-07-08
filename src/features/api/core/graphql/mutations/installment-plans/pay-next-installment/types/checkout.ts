import type {
    PaymentType,
} from "@modules/databases"

/**
 * Params for resolving a provider checkout link for one installment cycle.
 * PayOS / Sepay only (MVP is VND-only — see `docs/installment-payment-plan.md`).
 */
export interface ResolveInstallmentCheckoutParams {
    /** Payment provider to create the checkout with (PayOS / Sepay only). */
    paymentType: PaymentType
    /** Amount to charge this cycle, in VND (the plan's current minimum payment). */
    amount: number
    /** Provider order code (also stored as the transaction `referenceId`). */
    orderCode: number
    /** PayOS return URL (required for PayOS). */
    returnUrl?: string
    /** PayOS cancel URL (required for PayOS). */
    cancelUrl?: string
}

/** Params for building a SePay PG one-time-payment checkout for one installment cycle. */
export interface BuildSepayInstallmentCheckoutParams {
    /** Provider order code (also the transaction `referenceId`). */
    orderCode: number
    /** Amount to charge, in VND. */
    amount: number
    /** Redirect URL on success (optional). */
    successUrl?: string
    /** Redirect URL on cancel/error (optional). */
    cancelUrl?: string
}

/** Result of creating a provider checkout link for one installment cycle. */
export interface ResolveInstallmentCheckoutResult {
    /** URL the user visits to pay (redirect for PayOS, form action for SePay PG). */
    checkoutUrl: string
    /** Final charged amount, in VND (provider may echo it back). */
    amount: number
    /** SePay PG only: JSON of signed fields to POST as a form to `checkoutUrl`. */
    checkoutFields?: string
}
