import {
    PayOSService,
} from "@modules/payos"
import {
    envConfig,
} from "@modules/env"
import {
    BadRequestException,
    Injectable,
    ServiceUnavailableException,
} from "@nestjs/common"
import {
    verifyPaymentWebhookSignature,
} from "../utils/payos-signature"
import {
    PayosWebhookRequest,
    PayosWebhookResponse,
} from "./dtos"

/**
 * Verifies payOS webhook signatures and persists payloads via {@link PayOSService}.
 */
@Injectable()
export class PayosWebhookService {
    constructor(
        private readonly payosModuleService: PayOSService,
    ) {}

    /**
     * Webhook: verify HMAC signature, then store full payload on S3 keyed by `data.orderCode`.
     */
    async webhook(
        body: PayosWebhookRequest,
    ): Promise<PayosWebhookResponse> {
        const cfg = envConfig().payos
        if (!cfg.checksumKey) {
            throw new ServiceUnavailableException(
                "PAYOS_CHECKSUM_KEY is not configured",
            )
        }
        const valid = verifyPaymentWebhookSignature(
            body.data,
            body.signature,
            cfg.checksumKey,
        )
        if (!valid) {
            throw new BadRequestException(
                "Invalid PayOS webhook signature",
            )
        }
        const rawCode = body.data["orderCode"]
        const orderId =
            typeof rawCode === "number" || typeof rawCode === "string"
                ? String(rawCode)
                : "unknown"
        await this.payosModuleService.saveOrderSnapshot(
            orderId,
            body,
        )
        return {
            ok: true,
        }
    }
}
