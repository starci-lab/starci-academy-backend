import {
    Body,
    Controller,
    Headers,
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
    NowPaymentsWebhookRequest,
} from "./dtos"
import {
    NowPaymentsWebhookService,
} from "./webhook.service"

/**
 * NOWPayments IPN HTTP route.
 */
@Controller(
    {
        path: httpConfig().nowpayments().tags,
        version: "1",
    },
)
export class NowPaymentsWebhookController {
    constructor(
        private readonly nowPaymentsWebhookService: NowPaymentsWebhookService,
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
        // forward the IPN body + signature header to the service for verify + grant
        return this.nowPaymentsWebhookService.execute({
            body,
            signature: signature ?? "",
        })
    }
}
