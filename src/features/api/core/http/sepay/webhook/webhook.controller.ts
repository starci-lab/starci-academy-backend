import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ApiResponse,
    ApiOperation,
} from "@nestjs/swagger"
import {
    RestTransformInterceptor,
} from "@modules/api/rest/interceptors/rest-transform.interceptor"
import {
    httpConfig,
} from "../../http"
import {
    SepayWebhookRequest,
} from "./dtos/webhook.request"
import {
    SepayWebhookService,
} from "./webhook.service"
import {
    SepayWebhookGuard,
} from "./webhook.guard"

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
            status: 200,
            description: "Webhook authenticated and acknowledged.",
        },
    )
    @UseGuards(SepayWebhookGuard)
    @HttpCode(HttpStatus.OK)
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
