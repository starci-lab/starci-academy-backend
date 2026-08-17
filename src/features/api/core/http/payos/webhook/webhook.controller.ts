import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
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
    PayosWebhookRequest,
} from "./dtos/request"
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
            status: 200,
            description: "Webhook verified and acknowledged.",
        },
    )
    @Post(
        httpConfig().payos().webhook().path,
    )
    @HttpCode(HttpStatus.OK)
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
