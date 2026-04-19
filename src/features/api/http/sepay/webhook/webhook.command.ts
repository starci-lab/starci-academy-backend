import {
    SepayWebhookRequest,
} from "./dtos"

export class SepayWebhookCommand {
    constructor(
        readonly params: SepayWebhookRequest,
    ) {}
}
