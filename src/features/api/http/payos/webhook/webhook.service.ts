import {
    BadRequestException,
    Injectable,
} from "@nestjs/common"
import {
    InjectPayOS,
} from "@modules/payos"
import {
    PayOS,
    WebhookError,
} from "@payos/node"
import {
    PayosWebhookRequest,
    PayosWebhookResponse,
} from "./dtos"

/**
 * Verifies payOS webhooks via {@link PayOS#webhooks#verify} (checksum/signature handled by the SDK).
 *
 * @see https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/ — SDK: `payOS.webhooks.verify(req.body)`
 */
@Injectable()
export class PayosWebhookService {
    constructor(
        @InjectPayOS()
        private readonly payos: PayOS,
    ) {}

    /**
     * Entry: validates the webhook payload; throws {@link BadRequestException} when verification fails.
     */
    async execute(
        body: PayosWebhookRequest,
    ): Promise<PayosWebhookResponse> {
        try {
            await this.payos.webhooks.verify(
                body as Parameters<
                    PayOS["webhooks"]["verify"]
                >[0],
            )
        } catch (unknownError) {
            if (unknownError instanceof WebhookError) {
                throw new BadRequestException(
                    unknownError.message,
                )
            }
            throw unknownError
        }
        return {
            ok: true,
        }
    }
}
