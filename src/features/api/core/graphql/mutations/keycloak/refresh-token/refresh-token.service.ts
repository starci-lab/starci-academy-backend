import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    RefreshTokenCommand,
    type RefreshTokenParams,
} from "./refresh-token.command"
import type {
    RefreshTokenResult,
} from "./graphql-types/response"

@Injectable()
/** Forwards refresh to the command bus so the resolver can re-cookie the rotated token. */
export class RefreshTokenService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: RefreshTokenParams,
    ): Promise<RefreshTokenResult> {
        return this.commandBus.execute(
            new RefreshTokenCommand(params),
        )
    }
}

