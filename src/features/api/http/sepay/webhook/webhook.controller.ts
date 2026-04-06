import {
    Body,
    Controller,
    Post,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiResponse,
    ApiOperation,
} from "@nestjs/swagger"
import {
    RestTransformInterceptor,
} from "@modules/api"
import {
    httpConfig,
} from "../../http"
import {
    SepayWebhookRequest,
} from "./dtos"
import {
    SepayWebhookService,
} from "./webhook.service"

/**
 * SePay webhook HTTP route.
 */
@Controller(
    {
        path: httpConfig().sepay().tags,
        version: "1",
    },
)
export class SepayWebhookController {
    constructor(
        private readonly sepayWebhookService: SepayWebhookService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Webhook from SePay",
        description: "Webhook from SePay to verify the payment request.",
    })
    @ApiResponse(
        {
            status: 201,
            description: "Webhook processed and job enqueued.",
        },
    )
    @Post(
        httpConfig().sepay().webhook().path,
    )
    async webhook(
        @Body()
            body: SepayWebhookRequest,
    ) {
        return this.sepayWebhookService.execute(body)
    }
}
