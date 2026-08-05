import type {
    StripeWebhookParams,
} from "./types/webhook"

/** CQRS command carrying the raw Stripe webhook payload + signature. */
export class StripeWebhookCommand {
    constructor(
        readonly params: StripeWebhookParams,
    ) {}
}
