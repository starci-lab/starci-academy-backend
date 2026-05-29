import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    NowPaymentsWebhookCommand,
} from "./webhook.command"
import type {
    NowPaymentsWebhookParams,
} from "./types"

@Injectable()
export class NowPaymentsWebhookService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: NowPaymentsWebhookParams,
    ): Promise<void> {
        // dispatch the IPN body + signature to the CQRS handler
        return this.commandBus.execute(
            new NowPaymentsWebhookCommand(params),
        )
    }
}
