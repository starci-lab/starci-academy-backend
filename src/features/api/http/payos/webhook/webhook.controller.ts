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
    PayosWebhookRequest,
    PayosWebhookResponseDto
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

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Webhook from payOS",
        description: "Webhook from payOS to verify the payment request.",
    })
    @ApiResponse(
        {
            status: 201,
            description: "Webhook verified and snapshot stored.",
            type: PayosWebhookResponseDto,
        },
    )
    @Post(
        httpConfig().payos().webhook().path,
    )
    async webhook(
        @Body()
            body: PayosWebhookRequest,
    ) {
        console.log(body)
        return this.payosWebhookService.webhook(body)
    }
}
