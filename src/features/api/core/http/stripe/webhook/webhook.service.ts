import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    StripeWebhookCommand,
} from "./webhook.command"
import type {
    StripeWebhookParams,
} from "./types"

@Injectable()
/**
 * Dispatches the Stripe event through the command bus so the controller can ack before
 * enrollment runs.
 */
export class StripeWebhookService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: StripeWebhookParams,
    ): Promise<void> {
        // dispatch the raw payload + signature to the CQRS handler
        return this.commandBus.execute(
            new StripeWebhookCommand(params),
        )
    }
}
