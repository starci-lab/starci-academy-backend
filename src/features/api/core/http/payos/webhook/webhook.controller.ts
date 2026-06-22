import {
    Body,
    Controller,
    Logger,
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
    private readonly logger = new Logger(PayosWebhookController.name)

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
        },
    )
    @Post(
        httpConfig().payos().webhook().path,
    )
    async webhook(
        @Body()
            body: PayosWebhookRequest,
    ) {
        this.logger.log(
            `🔔 [PayOS] webhook received @ ${new Date().toISOString()} :: ${JSON.stringify(body)}`,
        )
        return this.payosWebhookService.execute(body)
    }
}
