/**
 * What the payment-status read acts on.
 *
 * The id is PayOS's own payment identifier, taken from the route. There is no viewer and no locale
 * on this path -- the SPA polls it while a payment settles -- but it still travels as a request
 * inside {@link ExecuteParams}, so a handler reads `query.params.request` here exactly as it does
 * everywhere else.
 */
export interface PaymentRequestRequest {
    /** The PayOS payment id being polled. */
    id: string
}
