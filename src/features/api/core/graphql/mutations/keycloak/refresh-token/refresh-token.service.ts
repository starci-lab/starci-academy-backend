import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    RefreshTokenCommand,
    type RefreshTokenCommandParams,
} from "./refresh-token.command"
import type {
    RefreshTokenCommandResult,
} from "./graphql-types"

@Injectable()
/** Forwards refresh to the command bus so the resolver can re-cookie the rotated token. */
export class RefreshTokenService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: RefreshTokenCommandParams,
    ): Promise<RefreshTokenCommandResult> {
        return this.commandBus.execute(
            new RefreshTokenCommand(params),
        )
    }
}

