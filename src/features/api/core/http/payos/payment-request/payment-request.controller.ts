import {
    Controller,
    Get,
    Param,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiResponse,
    ApiOperation,
} from "@nestjs/swagger"
import {
    RestSuccessMessage,
    RestTransformInterceptor,
} from "@modules/api/rest/interceptors/rest-transform.interceptor"
import {
    httpConfig,
} from "../../http"
import {
    PaymentRequestService,
} from "./payment-request.service"
import {
    PaymentRequestResponse,
} from "./dtos/response"

@Controller(
    {
        path: httpConfig().payos().tags,
        version: "1",
    },
)
/**
 * payOS GET payment request HTTP route.
 */
export class PaymentRequestController {
    constructor(
        private readonly paymentRequestService: PaymentRequestService,
    ) {}

    /**
     * Get payment request information from payOS.
     * @param id - The ID of the payment request.
     * @returns The payment request information from payOS.
     */
    @RestSuccessMessage("Payment request information from payOS.")
    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Get payment request information from payOS",
        description: "Get payment request information from payOS for development purposes.",
        deprecated: true,
    })
    @ApiResponse(
        {
            status: 200,
            description: "Payment link record from payOS (`paymentRequests.get` in SDK).",
            type: PaymentRequestResponse,
        },
    )
    @Get(
        `${httpConfig().payos().paymentRequest().path}/:id`,
    )
    async getPaymentRequest(
        @Param("id")
            id: string,
    ) {
        return this.paymentRequestService.execute(id)
    }
}
