import type {
    StripeWebhookParams,
} from "./types"

/** CQRS command carrying the raw Stripe webhook payload + signature. */
export class StripeWebhookCommand {
    constructor(
        readonly params: StripeWebhookParams,
    ) {}
}
