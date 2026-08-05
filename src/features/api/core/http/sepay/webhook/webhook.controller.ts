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
    SepayWebhookRequest,
} from "./dtos"
import {
    SepayWebhookService,
} from "./webhook.service"

@Controller(
    {
        path: httpConfig().sepay().tags,
        version: "1",
    },
)
/**
 * SePay webhook HTTP route.
 */
export class SepayWebhookController {
    private readonly logger = new Logger(SepayWebhookController.name)

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
        // loud entry log so a real CK (bank transfer) IPN is visible the instant it lands
        this.logger.log(
            `🔔 [SePay] webhook received @ ${new Date().toISOString()} :: ${JSON.stringify(body)}`,
        )
        return this.sepayWebhookService.execute(body)
    }
}
