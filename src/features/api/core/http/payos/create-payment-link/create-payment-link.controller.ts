import {
    Body,
    Controller,
    Post,
    UseInterceptors,
} from "@nestjs/common"
import {
    httpConfig,
} from "../../http"
import {
    CreatePaymentLinkRequest,
} from "./dtos/request"
import {
    CreatePaymentLinkService,
} from "./create-payment-link.service"
import {
    ApiOperation,
    ApiResponse,
} from "@nestjs/swagger"
import {
    CreatePaymentLinkResponse,
} from "./dtos/response"
import {
    RestSuccessMessage,
    RestTransformInterceptor,
} from "@modules/api/rest/interceptors/rest-transform.interceptor"


@Controller(
    {
        path: httpConfig().payos().tags,
        version: "1",
    },
)
/**
 * payOS create payment link HTTP route.
 */
export class CreatePaymentLinkController {
    constructor(
        private readonly createPaymentLinkService: CreatePaymentLinkService,
    ) {}

    /**
     * Create a payment link.
     * @param body - The request body.
     * @returns The payment link.
     */
    @RestSuccessMessage("Payment link has been created successfully.")
    @UseInterceptors(RestTransformInterceptor)
    @ApiOperation({
        summary: "Create payment link",
        description: "Create a payment link for development purposes.",
        deprecated: true,
    })
    @ApiResponse(
        {
            status: 201,
            description: "The payment link has been created successfully.",
            type: CreatePaymentLinkResponse,
        },
    )
    @Post(
        httpConfig().payos().createPaymentLink().path,
    )
    async createPaymentLink(
        @Body()
            body: CreatePaymentLinkRequest,
    ) {
        return this.createPaymentLinkService.execute(body)
    }
}
