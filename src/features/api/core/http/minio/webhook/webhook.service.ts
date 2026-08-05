import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    MinioWebhookRequest,
} from "./dtos/webhook.request"
import {
    MinioWebhookCommand,
} from "./webhook.command"

@Injectable()
/**
 * Dispatches the MinIO notification through the command bus so the controller can return
 * 200 before any side effect.
 */
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
