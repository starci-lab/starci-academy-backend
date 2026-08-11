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
    DisableTwoFactorRequest,
} from "./graphql-types/request"
import {
    DisableTwoFactorCommand,
} from "./disable-two-factor.command"

@Injectable()
/** Dispatches TOTP disable to its command handler. */
export class DisableTwoFactorService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(params: ExecuteParams<DisableTwoFactorRequest>): Promise<undefined> {
        return this.commandBus.execute(new DisableTwoFactorCommand(params))
    }
}
