/** Params for signing a SePay PG one-time-payment checkout. */
export interface SignSepayFieldsParams {
    /** Provider order code (also the transaction `referenceId`). */
    orderCode: number
    /** Amount to charge, in VND. */
    amount: number
    /** Redirect URL on success (optional). */
    successUrl?: string
    /** Redirect URL on cancel/error (optional). */
    cancelUrl?: string
}
