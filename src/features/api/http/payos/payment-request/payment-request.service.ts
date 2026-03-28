import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    PayOS,
} from "@payos/node"
import {
    PaymentRequestResponseData,
} from "./dtos"

/**
 * GET payment request by id via {@link PayOS#paymentRequests#get}.
 *
 * @see https://payos.vn/docs/api/ — `GET /v2/payment-requests/{id}`
 */
@Injectable()
export class PaymentRequestService {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
    ) {}

    /**
     * Entry: get payment request by id.
     * @param id - The ID of the payment request.
     * @returns The payment request.
     */
    async execute(
        id: string,
    ): Promise<PaymentRequestResponseData> {
        return await this.payos.paymentRequests.get(
            id,
        )
    }
}
