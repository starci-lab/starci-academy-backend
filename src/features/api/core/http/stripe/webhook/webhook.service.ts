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
