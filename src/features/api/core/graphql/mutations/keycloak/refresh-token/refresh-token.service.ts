import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    RefreshTokenData,
    RefreshTokenRequest,
} from "./graphql-types"
import {
    RefreshTokenCommand,
} from "./refresh-token.command"

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        request: RefreshTokenRequest,
    ): Promise<RefreshTokenData> {
        return this.commandBus.execute(
            new RefreshTokenCommand({
                request,
            }),
        )
    }
}

