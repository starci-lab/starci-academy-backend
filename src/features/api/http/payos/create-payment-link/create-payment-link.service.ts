import {
    Injectable,
} from "@nestjs/common"
import {
    CreatePaymentLinkRequest,
} from "./dtos"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    PayOS 
} from "@payos/node"
import {
    CreatePaymentLinkResponseData 
} from "./dtos/response"

/**
 * Creates payOS payment links (merchant API).
 */
@Injectable()
export class CreatePaymentLinkService {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
    ) {}

    /**
     * Entry: creates a payOS payment link.
     * @param dto - The request body.
     * @returns The response from the payOS merchant API.
     */
    async execute(
        {
            amount,
            cancelUrl,
            description,
            orderCode,
            returnUrl,
        }: CreatePaymentLinkRequest,
    ): Promise<CreatePaymentLinkResponseData> {
        const paymentLink = await this.payos.paymentRequests.create(
            {
                amount,
                cancelUrl,
                description,
                orderCode,
                returnUrl,
            },
        )
        return paymentLink
    }
}
