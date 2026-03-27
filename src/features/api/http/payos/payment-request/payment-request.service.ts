import {
    AxiosService,
} from "@modules/axios"
import {
    Injectable,
} from "@nestjs/common"
import {
    assertPayosMerchantConfigured,
    createPayosMerchantAxios,
    rethrowPayosAxiosError,
} from "../utils/payos-merchant-client"
import {
    GetPaymentRequestResponse,
} from "./dtos"

/**
 * GET payment request by id (merchant API).
 */
@Injectable()
export class PaymentRequestService {
    constructor(
        private readonly axiosService: AxiosService,
    ) {}

    async getPaymentRequest(
        id: string,
    ): Promise<GetPaymentRequestResponse> {
        assertPayosMerchantConfigured()
        const client = createPayosMerchantAxios(
            this.axiosService,
        )
        try {
            const response = await client.get(
                `/v2/payment-requests/${encodeURIComponent(id)}`,
            )
            return response.data as GetPaymentRequestResponse
        } catch (unknownError) {
            rethrowPayosAxiosError(
                "PayOS get payment request failed",
                unknownError,
            )
        }
    }
}
