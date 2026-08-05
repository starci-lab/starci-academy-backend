import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    CreatePaymentLinkCommand,
} from "./create-payment-link.command"
import {
    CreatePaymentLinkRequest,
} from "./dtos"
import {
    CreatePaymentLinkResponseData,
} from "./dtos/response"

@Injectable()
/**
 * Dispatches payment-link create through the command bus so the controller stays a thin
 * REST leaf.
 */
export class CreatePaymentLinkService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        dto: CreatePaymentLinkRequest,
    ): Promise<CreatePaymentLinkResponseData> {
        return this.commandBus.execute(
            new CreatePaymentLinkCommand(dto),
        )
    }
}
