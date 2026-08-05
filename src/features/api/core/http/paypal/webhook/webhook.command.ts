import type {
    PaypalWebhookParams,
} from "./types/webhook"

/** CQRS command carrying the PayPal webhook body + signature headers. */
export class PaypalWebhookCommand {
    constructor(
        readonly params: PaypalWebhookParams,
    ) {}
}
