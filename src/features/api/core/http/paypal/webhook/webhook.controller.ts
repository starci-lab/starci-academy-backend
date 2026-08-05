import {
    Body,
    Controller,
    Headers,
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
    PaypalWebhookRequest,
} from "./dtos"
import {
    PaypalWebhookService,
} from "./webhook.service"

@Controller(
    {
        path: httpConfig().paypal().tags,
        version: "1",
    },
)
/**
 * PayPal webhook HTTP route.
 */
export class PaypalWebhookController {
    private readonly logger = new Logger(PaypalWebhookController.name)

    constructor(
        private readonly paypalWebhookService: PaypalWebhookService,
    ) {}

    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Webhook from PayPal",
        description: "Webhook from PayPal to verify an approved/captured order.",
    })
    @ApiResponse(
        {
            status: 201,
            description: "Webhook verified and grant dispatched.",
        },
    )
    @Post(
        httpConfig().paypal().webhook().path,
    )
    async webhook(
        @Body()
            body: PaypalWebhookRequest,
        @Headers("paypal-auth-algo")
            authAlgo: string,
        @Headers("paypal-cert-url")
            certUrl: string,
        @Headers("paypal-transmission-id")
            transmissionId: string,
        @Headers("paypal-transmission-sig")
            transmissionSig: string,
        @Headers("paypal-transmission-time")
            transmissionTime: string,
    ) {
        this.logger.log(
            `🔔 [PayPal] webhook received @ ${new Date().toISOString()} :: event=${String(body?.event_type)} sig=${transmissionSig ? "present" : "MISSING"}`,
        )
        // forward the body + signature headers to the service for verify + grant
        return this.paypalWebhookService.execute({
            body,
            authAlgo: authAlgo ?? "",
            certUrl: certUrl ?? "",
            transmissionId: transmissionId ?? "",
            transmissionSig: transmissionSig ?? "",
            transmissionTime: transmissionTime ?? "",
        })
    }
}
