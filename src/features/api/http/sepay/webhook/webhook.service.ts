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
