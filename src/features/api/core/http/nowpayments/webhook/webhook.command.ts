import type {
    NowPaymentsWebhookParams,
} from "./types/webhook"

/** CQRS command carrying the NOWPayments IPN body + signature header. */
export class NowPaymentsWebhookCommand {
    constructor(
        readonly params: NowPaymentsWebhookParams,
    ) {}
}
