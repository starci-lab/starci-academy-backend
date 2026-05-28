import type {
    PaymentType,
} from "@modules/databases"

/** Params for resolving a provider checkout link. */
export interface ResolveCheckoutParams {
    /** Payment provider to create the checkout with. */
    paymentType: PaymentType
    /** Amount to charge, in VND. */
    amount: number
    /** Provider order code (also stored as the transaction `referenceId`). */
    orderCode: number
    /** PayOS return URL (required for PayOS). */
    payosReturnUrl?: string
    /** PayOS cancel URL (required for PayOS). */
    payosCancelUrl?: string
}

/** Params for building a SePay PG one-time-payment checkout. */
export interface BuildSepayCheckoutParams {
    /** Provider order code (also the transaction `referenceId`). */
    orderCode: number
    /** Amount to charge, in VND. */
    amount: number
    /** Redirect URL on success (optional). */
    successUrl?: string
    /** Redirect URL on cancel/error (optional). */
    cancelUrl?: string
}

/** Result of creating a provider checkout link. */
export interface ResolveCheckoutResult {
    /** URL the user visits to pay (redirect for PayOS, form action for SePay PG). */
    checkoutUrl: string
    /** Final charged amount, in VND (provider may echo it back). */
    amount: number
    /** SePay PG only: JSON of signed fields to POST as a form to `checkoutUrl`. */
    checkoutFields?: string
}
