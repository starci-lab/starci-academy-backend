import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    PayosWebhookRequest,
} from "./dtos"
import {
    PayosWebhookCommand,
} from "./webhook.command"

@Injectable()
/**
 * Dispatches the PayOS IPN through the command bus so the controller can ack before
 * enrollment runs.
 */
export class PayosWebhookService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        body: PayosWebhookRequest,
    ): Promise<void> {
        return this.commandBus.execute(
            new PayosWebhookCommand(body),
        )
    }
}
