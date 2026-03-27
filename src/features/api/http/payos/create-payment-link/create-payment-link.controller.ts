import {
    Body,
    Controller,
    Post,
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
