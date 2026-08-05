import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    PaypalWebhookCommand,
} from "./webhook.command"
import type {
    PaypalWebhookParams,
} from "./types"

@Injectable()
/**
 * Dispatches the PayPal event through the command bus so the controller can ack before
 * enrollment runs.
 */
export class PaypalWebhookService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: PaypalWebhookParams,
    ): Promise<void> {
        // dispatch the body + signature headers to the CQRS handler
        return this.commandBus.execute(
            new PaypalWebhookCommand(params),
        )
    }
}
