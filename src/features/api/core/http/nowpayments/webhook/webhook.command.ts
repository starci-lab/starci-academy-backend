import type {
    NowPaymentsWebhookParams,
} from "./types"

/** CQRS command carrying the NOWPayments IPN body + signature header. */
export class NowPaymentsWebhookCommand {
    constructor(
        readonly params: NowPaymentsWebhookParams,
    ) {}
}
