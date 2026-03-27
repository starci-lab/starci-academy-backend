import {
    AxiosService,
} from "@modules/axios"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    assertPayosMerchantConfigured,
    createPayosMerchantAxios,
    rethrowPayosAxiosError,
} from "../utils/payos-merchant-client"
import {
    createPaymentRequestSignature,
} from "../utils/payos-signature"
import {
    CreatePaymentLinkRequest,
    CreatePaymentLinkResponse,
} from "./dtos"

/**
 * Creates payOS payment links (merchant API).
 */
@Injectable()
export class CreatePaymentLinkService {
    constructor(
        private readonly axiosService: AxiosService,
    ) {}

    async createPaymentLink(
        dto: CreatePaymentLinkRequest,
    ): Promise<CreatePaymentLinkResponse> {
        assertPayosMerchantConfigured()
        const cfg = envConfig().payos
        const signature = createPaymentRequestSignature(
            {
                amount: dto.amount,
                cancelUrl: dto.cancelUrl,
                description: dto.description,
                orderCode: dto.orderCode,
                returnUrl: dto.returnUrl,
            },
            cfg.checksumKey,
        )
        const payload: Record<string, unknown> = {
            orderCode: dto.orderCode,
            amount: dto.amount,
            description: dto.description,
            returnUrl: dto.returnUrl,
            cancelUrl: dto.cancelUrl,
            signature,
        }
        if (dto.buyerName !== undefined) {
            payload.buyerName = dto.buyerName
        }
        if (dto.buyerEmail !== undefined) {
            payload.buyerEmail = dto.buyerEmail
        }
        if (dto.buyerPhone !== undefined) {
            payload.buyerPhone = dto.buyerPhone
        }
        if (dto.expiredAt !== undefined) {
            payload.expiredAt = dto.expiredAt
        }
        const client = createPayosMerchantAxios(
            this.axiosService,
        )
        try {
            const response = await client.post(
                "/v2/payment-requests",
                payload,
            )
            return response.data as CreatePaymentLinkResponse
        } catch (unknownError) {
            rethrowPayosAxiosError(
                "PayOS create payment link failed",
                unknownError,
            )
        }
    }
}
