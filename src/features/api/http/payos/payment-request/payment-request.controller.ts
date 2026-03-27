import {
    Controller,
    Get,
    Param,
} from "@nestjs/common"
import {
    httpConfig,
} from "../../http"
import {
    PaymentRequestService,
} from "./payment-request.service"

/**
 * payOS GET payment request HTTP route.
 */
@Controller(
    {
        path: httpConfig().payos().tags,
        version: "1",
    },
)
export class PaymentRequestController {
    constructor(
        private readonly paymentRequestService: PaymentRequestService,
    ) {}

    @Get(
        `${httpConfig().payos().paymentRequest().path}/:id`,
    )
    async getPaymentRequest(
        @Param("id")
        id: string,
    ) {
        return this.paymentRequestService.getPaymentRequest(id)
    }
}
