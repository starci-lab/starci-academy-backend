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
} from "./dtos"
import {
    CreatePaymentLinkService,
} from "./create-payment-link.service"
import {
    ApiResponse 
} from "@nestjs/swagger"
import {
    CreatePaymentLinkResponse,
} from "./dtos"
import {
    RestSuccessMessage,
    RestTransformInterceptor,
} from "@modules/api"

/**
 * payOS create payment link HTTP route.
 */
@Controller(
    {
        path: httpConfig().payos().tags,
        version: "1",
    },
)
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
        return this.createPaymentLinkService.createPaymentLink(body)
    }
}
