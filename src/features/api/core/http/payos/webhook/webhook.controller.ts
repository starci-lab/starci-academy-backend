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
    PayosWebhookRequest,
} from "./dtos"
import {
    PayosWebhookService,
} from "./webhook.service"

@Controller(
    {
        path: httpConfig().payos().tags,
        version: "1",
    },
)
/**
 * payOS webhook HTTP route.
 */
export class PayosWebhookController {
    constructor(
        private readonly payosWebhookService: PayosWebhookService,
        private readonly winstonService: WinstonService,
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
        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "payos.webhook.received",
                referenceId: body.data?.orderCode != null
                    ? String(body.data.orderCode)
                    : undefined,
                meta: {
                    code: body.code,
                    success: body.success,
                    receivedAt: new Date().toISOString(),
                },
            },
        )
        return this.payosWebhookService.execute(body)
    }
}
