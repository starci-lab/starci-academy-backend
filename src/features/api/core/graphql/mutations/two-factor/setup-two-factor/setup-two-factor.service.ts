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
    SetupTwoFactorData,
} from "./graphql-types/response"
import {
    SetupTwoFactorCommand,
} from "./setup-two-factor.command"

@Injectable()
/** Dispatches TOTP setup; all enrollment decisions stay in the handler. */
export class SetupTwoFactorService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(params: ExecuteParams<undefined>): Promise<SetupTwoFactorData> {
        return this.commandBus.execute(new SetupTwoFactorCommand(params))
    }
}
