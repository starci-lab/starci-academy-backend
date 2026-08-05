import {
    Controller,
    Headers,
    Post,
    RawBodyRequest,
    Req,
    UseInterceptors,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    Request,
} from "express"
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
    StripeWebhookService,
} from "./webhook.service"

@Controller(
    {
        path: httpConfig().stripe().tags,
        version: "1",
    },
)
/**
 * Stripe webhook HTTP route. Reads the raw request body (kept via the app's
 * `rawBody: true` bootstrap) so the signature can be verified.
 */
export class StripeWebhookController {
    constructor(
        private readonly stripeWebhookService: StripeWebhookService,
        private readonly winstonService: WinstonService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Webhook from Stripe",
        description: "Webhook from Stripe to verify a completed Checkout Session.",
    })
    @ApiResponse(
        {
            status: 201,
            description: "Webhook verified and grant dispatched.",
        },
    )
    @Post(
        httpConfig().stripe().webhook().path,
    )
    async webhook(
        @Req()
            request: RawBodyRequest<Request>,
        @Headers("stripe-signature")
            signature: string,
    ) {
        this.winstonService.log(
            WinstonLog.PaymentWebhookReceived,
            {
                op: "stripe.webhook.received",
                meta: {
                    rawBodyBytes: request.rawBody?.length ?? 0,
                    signaturePresent: Boolean(signature),
                    receivedAt: new Date().toISOString(),
                },
            },
        )
        // hand the raw body + signature to the service for verification + grant
        return this.stripeWebhookService.execute({
            // rawBody is populated because the app boots with `rawBody: true`
            rawBody: request.rawBody ?? Buffer.from(""),
            signature: signature ?? "",
        })
    }
}
