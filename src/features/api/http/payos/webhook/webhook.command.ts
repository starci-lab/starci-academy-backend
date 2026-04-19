import {
    PayosWebhookRequest,
} from "./dtos"

export class PayosWebhookCommand {
    constructor(
        readonly params: PayosWebhookRequest,
    ) {}
}
