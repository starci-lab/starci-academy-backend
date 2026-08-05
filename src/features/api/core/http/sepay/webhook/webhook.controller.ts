import {
    Body,
    Controller,
    Post,
    UseInterceptors,
} from "@nestjs/common"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
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
    constructor(
        private readonly sepayWebhookService: SepayWebhookService,
        private readonly winstonService: WinstonService,
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
        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "sepay.webhook.received",
                referenceId: body.order?.order_invoice_number ?? body.order_invoice_number,
                meta: {
                    receivedAt: new Date().toISOString(),
                },
            },
        )
        return this.sepayWebhookService.execute(body)
    }
}
