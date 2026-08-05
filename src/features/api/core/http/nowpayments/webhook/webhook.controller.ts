import {
    Body,
    Controller,
    Headers,
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
    NowPaymentsWebhookRequest,
} from "./dtos/webhook.request"
import {
    NowPaymentsWebhookService,
} from "./webhook.service"

@Controller(
    {
        path: httpConfig().nowpayments().tags,
        version: "1",
    },
)
/**
 * NOWPayments IPN HTTP route.
 */
export class NowPaymentsWebhookController {
    constructor(
        private readonly nowPaymentsWebhookService: NowPaymentsWebhookService,
        private readonly winstonService: WinstonService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "IPN from NOWPayments",
        description: "IPN callback from NOWPayments to verify a finished crypto payment.",
    })
    @ApiResponse(
        {
            status: 201,
            description: "IPN verified and grant dispatched.",
        },
    )
    @Post(
        httpConfig().nowpayments().webhook().path,
    )
    async webhook(
        @Body()
            body: NowPaymentsWebhookRequest,
        @Headers("x-nowpayments-sig")
            signature: string,
    ) {
        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "nowpayments.webhook.received",
                referenceId: body.order_id,
                meta: {
                    paymentId: body.payment_id != null ? String(body.payment_id) : undefined,
                    paymentStatus: body.payment_status,
                    signaturePresent: Boolean(signature),
                    receivedAt: new Date().toISOString(),
                },
            },
        )
        // forward the IPN body + signature header to the service for verify + grant
        return this.nowPaymentsWebhookService.execute({
            body,
            signature: signature ?? "",
        })
    }
}
