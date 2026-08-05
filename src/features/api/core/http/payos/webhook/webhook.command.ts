import {
    PayosWebhookRequest,
} from "./dtos/request"

/**
 * CQRS envelope for a PayOS IPN so signature verification and settlement stay out of the
 * controller.
 */
export class PayosWebhookCommand {
    constructor(
        readonly params: PayosWebhookRequest,
    ) {}
}
