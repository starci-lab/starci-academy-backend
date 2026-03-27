import {
    Body,
    Controller,
    Post,
} from "@nestjs/common"
import {
    httpConfig,
} from "../../http"
import {
    PayosWebhookRequest,
} from "./dtos"
import {
    PayosWebhookService,
} from "./webhook.service"

/**
 * payOS webhook HTTP route.
 */
@Controller(
    {
        path: httpConfig().payos().tags,
        version: "1",
    },
)
export class PayosWebhookController {
    constructor(
        private readonly payosWebhookService: PayosWebhookService,
    ) {}

    @Post(
        httpConfig().payos().webhook().path,
    )
    async webhook(
        @Body()
        body: PayosWebhookRequest,
    ) {
        return this.payosWebhookService.webhook(body)
    }
}
