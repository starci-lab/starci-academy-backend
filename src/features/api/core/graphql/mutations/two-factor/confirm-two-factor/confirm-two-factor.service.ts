import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    ConfirmTwoFactorRequest,
} from "./graphql-types/request"
import {
    ConfirmTwoFactorCommand,
} from "./confirm-two-factor.command"

@Injectable()
/** Dispatches TOTP confirmation to its command handler. */
export class ConfirmTwoFactorService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(params: ExecuteParams<ConfirmTwoFactorRequest>): Promise<undefined> {
        return this.commandBus.execute(new ConfirmTwoFactorCommand(params))
    }
}
