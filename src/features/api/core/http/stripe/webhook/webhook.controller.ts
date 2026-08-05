import {
    Controller,
    Headers,
    Logger,
    Post,
    RawBodyRequest,
    Req,
    UseInterceptors,
} from "@nestjs/common"
import type {
    Request,
} from "express"
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
    private readonly logger = new Logger(StripeWebhookController.name)

    constructor(
        private readonly stripeWebhookService: StripeWebhookService,
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
        this.logger.log(
            `🔔 [Stripe] webhook received @ ${new Date().toISOString()} :: rawBody=${request.rawBody?.length ?? 0}B sig=${signature ? "present" : "MISSING"}`,
        )
        // hand the raw body + signature to the service for verification + grant
        return this.stripeWebhookService.execute({
            // rawBody is populated because the app boots with `rawBody: true`
            rawBody: request.rawBody ?? Buffer.from(""),
            signature: signature ?? "",
        })
    }
}
