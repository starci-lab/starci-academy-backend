import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    MinioWebhookRequest,
} from "./dtos"
import {
    MinioWebhookCommand,
} from "./webhook.command"

@Injectable()
export class MinioWebhookService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        body: MinioWebhookRequest,
    ): Promise<void> {
        return this.commandBus.execute(
            new MinioWebhookCommand(body),
        )
    }
}
