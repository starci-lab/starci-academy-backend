import {
    Controller,
    Headers,
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

/**
 * Stripe webhook HTTP route. Reads the raw request body (kept via the app's
 * `rawBody: true` bootstrap) so the signature can be verified.
 */
@Controller(
    {
        path: httpConfig().stripe().tags,
        version: "1",
    },
)
export class StripeWebhookController {
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
        // hand the raw body + signature to the service for verification + grant
        return this.stripeWebhookService.execute({
            // rawBody is populated because the app boots with `rawBody: true`
            rawBody: request.rawBody ?? Buffer.from(""),
            signature: signature ?? "",
        })
    }
}
