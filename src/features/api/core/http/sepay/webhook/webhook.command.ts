import {
    SepayWebhookRequest,
} from "./dtos"

/**
 * CQRS envelope for a SePay PG notification so invoice matching stays out of the
 * controller.
 */
export class SepayWebhookCommand {
    constructor(
        readonly params: SepayWebhookRequest,
    ) {}
}
