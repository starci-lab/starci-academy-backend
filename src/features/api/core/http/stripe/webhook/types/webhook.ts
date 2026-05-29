/** Raw Stripe webhook payload + signature needed to verify the event. */
export interface StripeWebhookParams {
    /** Raw request body bytes (required for Stripe signature verification). */
    rawBody: Buffer
    /** The `stripe-signature` header value Stripe sent. */
    signature: string
}
