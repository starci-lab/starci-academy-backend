/** Params for creating a NOWPayments hosted invoice (crypto checkout). */
export interface CreateNowPaymentsInvoiceParams {
    /** Price in the fiat `priceCurrency` (NOWPayments converts to crypto). */
    amount: number
    /** Our reference id (also the transaction `referenceId`); sent as `order_id`. */
    referenceId: string
    /** Human-readable order description shown on the invoice. */
    description: string
    /** URL NOWPayments redirects to after a successful payment. */
    successUrl: string
    /** URL NOWPayments redirects to when the customer cancels. */
    cancelUrl: string
}

/** Result of creating a NOWPayments invoice. */
export interface CreateNowPaymentsInvoiceResult {
    /** NOWPayments invoice id. */
    invoiceId: string
    /** Hosted invoice URL the customer is redirected to in order to pay. */
    invoiceUrl: string
}

/** Params for verifying a NOWPayments IPN callback signature. */
export interface VerifyNowPaymentsSignatureParams {
    /** Raw JSON-decoded IPN body NOWPayments posted. */
    body: Record<string, unknown>
    /** `x-nowpayments-sig` header value (HMAC-SHA512 of the sorted body). */
    signature: string
}
