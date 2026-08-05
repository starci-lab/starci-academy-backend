import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SepayWebhookRequest,
} from "./dtos"
import {
    SepayWebhookCommand,
} from "./webhook.command"

@Injectable()
/**
 * Dispatches the SePay IPN through the command bus so the controller can ack before
 * enrollment runs.
 */
export class SepayWebhookService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        body: SepayWebhookRequest,
    ): Promise<void> {
        return this.commandBus.execute(
            new SepayWebhookCommand(body),
        )
    }
}
