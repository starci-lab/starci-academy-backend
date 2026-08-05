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
/**
 * Dispatches the IPN through the command bus so the controller can ack quickly and keep
 * NOWPayments from retry-storming.
 */
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
