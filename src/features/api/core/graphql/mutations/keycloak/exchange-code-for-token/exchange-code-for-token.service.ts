import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    ExchangeCodeForTokenData,
    ExchangeCodeForTokenRequest,
} from "./graphql-types"
import {
    ExchangeCodeForTokenCommand,
} from "./exchange-code-for-token.command"

@Injectable()
export class ExchangeCodeForTokenService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        request: ExchangeCodeForTokenRequest,
    ): Promise<ExchangeCodeForTokenData> {
        return this.commandBus.execute(
            new ExchangeCodeForTokenCommand({
                request,
            }),
        )
    }
}

